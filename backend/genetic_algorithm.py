import pandas as pd
import numpy as np
import itertools
import random
import joblib
import logging
from typing import List, Dict, Tuple, Any, Callable
from functools import lru_cache
from collections import defaultdict
import traceback
from sqlalchemy.orm import Session
import models  ######### Changed from backend.models to models

logger = logging.getLogger(__name__)

class CoalBlendOptimizer:
    def __init__(self, model_path: str, coal_data: pd.DataFrame):
        self.model = joblib.load(model_path)
        self.coal_df = coal_data
        
        ######### Convert coal data to numpy arrays for faster computation
        self.coal_features = self.coal_df.iloc[:, 1:-1].values.astype(float)
        self.coal_costs = self.coal_df['Cost'].values
        self.coal_names = self.coal_df['Name_of_coal'].values
        
        ######### Pre-compute valid ratios as a list of tuples
        self.NONZERO_RATIO_POOL = self._valid_nonzero_ratios()
        
        ######### Default constraints
        self.constraints = {
            'blend': {
                'ash': (5, 15),
                'vm': (15, 35),
                'fc': (50, 75),
                'csn': (4, 8),
            },
            'coke': {
                'cri': (20, 30),
                'csr': (60, 75),
                'ash': (8, 12),
                'vm': (0.5, 2.0)
            }
        }
        
        ##### GA Settings
        self.POP_SIZE = 100
        self.N_GEN = 30
        self.MUTATION_RATE = 0.4  ### Increased mutation rate
        self.ELITE_SIZE = 10
        self.TOURNAMENT_SIZE = 5
        
        ### Cache for fitness calculations
        self._fitness_cache = {}
        self._blend_cache = {}
        
        ### Track unique solutions
        self._unique_solutions = set()
        ### Track all unique blends found during optimization
        self._all_unique_blends = set()

    def _valid_nonzero_ratios(self) -> List[Tuple[int, ...]]:
        """Generate valid ratio combinations."""
        parts = np.arange(5, 100, 5)
        ratios = []
        for r in itertools.product(parts, repeat=3):
            if sum(r) == 100 and all(p > 0 for p in r):
                ratios.append(tuple(r))
        return ratios

    @lru_cache(maxsize=1000)
    def get_blend_features(self, indices: Tuple[int, ...], ratios: Tuple[float, ...]) -> np.ndarray:
        """Vectorized blend feature calculation with caching."""
        blend = np.sum(self.coal_features[list(indices)] * np.array(ratios)[:, np.newaxis] / 100, axis=0)
        return blend

    def predict_properties(self, blend: np.ndarray) -> np.ndarray:
        """Vectorized property prediction."""
        # The ML model expects 22 features (without N), but our blend has 23 features (with N)
        # So we exclude the last column (N) when passing to the model
        blend_without_n = blend[:-1]  # Remove the last element (N column)
        
        feature_names = [
            'IM', 'Ash', 'VM_weight', 'FC', 'S', 'P', 'SiO2', 'Al2O3', 'Fe2O3', 
            'CaO', 'MgO', 'Na2O', 'K2O', 'TiO2', 'Mn3O4', 'SO3', 'P2O5', 
            'BaO', 'SrO', 'ZnO', 'CRI_weight', 'CSR_weight'
        ]
        blend_df = pd.DataFrame([blend_without_n], columns=feature_names)
        preds = self.model.predict(blend_df)[0]
        ### Convert coke properties to percentages
        preds[4:8] *= 100  ### Vectorized conversion
        return preds
    ### ###   predicted_coal_properties = {
    ###         "ash_percent": float(predictions[0]),
    ###         "vm_percent": float(predictions[1]),
    ###         "fc_percent": float(predictions[2]),
    ###         "CSN": float(predictions[3])       
    ###     }
    ###     predicted_coke_properties={
    ###         "CRI": float(predictions[4]*100),
    ###         "CSR": float(predictions[5]*100),
    ###         "ASH": float(predictions[6]*100),
    ###         "VM": float(predictions[7]*100)
    ###     }

    def compute_penalty(self, preds: np.ndarray) -> float:
        """Vectorized penalty computation."""
        penalty = 0
        keys = list(self.constraints['blend'].keys()) + list(self.constraints['coke'].keys())
        for i, key in enumerate(keys):
            low, high = self.constraints['blend'].get(key, self.constraints['coke'].get(key))
            val = preds[i]
            if val < low:
                penalty += (low - val) ** 2
            elif val > high:
                penalty += (val - high) ** 2
        return penalty

    def compute_cost(self, indices: List[int], ratios: List[float]) -> float:
        """Vectorized cost computation."""
        return np.sum(self.coal_costs[indices] * np.array(ratios)) / 100

    def fitness(self, individual: List[Any]) -> float:
        """Optimized fitness calculation with caching."""
        indices = tuple(individual[:3])
        ratios = tuple(individual[3:])
        
        ### Check cache
        cache_key = (indices, ratios)
        if cache_key in self._fitness_cache:
            return self._fitness_cache[cache_key]
        
        ### Calculate fitness
        blend_features = self.get_blend_features(indices, ratios)
        preds = self.predict_properties(blend_features)
        penalty = self.compute_penalty(preds)
        cost = self.compute_cost(list(indices), list(ratios))
        
        ### Cache result
        self._fitness_cache[cache_key] = cost + penalty
        return self._fitness_cache[cache_key]

    def _is_unique_solution(self, indices: Tuple[int, ...], ratios: Tuple[int, ...]) -> bool:
        """Check if a solution is unique."""
        solution_key = (tuple(sorted(indices)), tuple(sorted(ratios)))
        if solution_key in self._unique_solutions:
            return False
        self._unique_solutions.add(solution_key)
        return True

    def generate_individual(self) -> List[Any]:
        """Generate a unique individual."""
        max_attempts = 50
        for _ in range(max_attempts):
            indices = tuple(random.sample(range(len(self.coal_df)), 3))
            ratios = random.choice(self.NONZERO_RATIO_POOL)
            if self._is_unique_solution(indices, ratios):
                return list(indices) + list(ratios)
        ### If we can't find a unique solution, return a random one
        indices = tuple(random.sample(range(len(self.coal_df)), 3))
        ratios = random.choice(self.NONZERO_RATIO_POOL)
        return list(indices) + list(ratios)

    def optimize(self, custom_constraints: Dict = None, stop_check: Callable[[], bool] = None) -> Dict:
        """Main optimization method with enhanced logging and error handling."""
        try:
            logger.info("Starting optimization with constraints: %s", custom_constraints)
            
            if custom_constraints:
                self._update_constraints(custom_constraints)
            
            ### Reset unique solutions tracking
            self._unique_solutions.clear()
            self._fitness_cache.clear()
            self._all_unique_blends.clear()
            
            ### Initialize population
            population = [self.generate_individual() for _ in range(self.POP_SIZE)]
            best_fitness = float('inf')
            generations_without_improvement = 0
            best_solution = None
            
            ### Run GA
            for gen in range(self.N_GEN):
                ### Check if should stop
                if stop_check and stop_check():
                    logger.info("Optimization stopped by user request")
                    return None
                    
                logger.info(f"Generation {gen+1}/{self.N_GEN}")
                
                ### Sort population by fitness
                population.sort(key=self.fitness)
                
                ### Check for improvement
                current_best_fitness = self.fitness(population[0])
                if current_best_fitness < best_fitness:
                    best_fitness = current_best_fitness
                    best_solution = population[0]
                    generations_without_improvement = 0
                    logger.info(f"New best fitness: {best_fitness}")
                else:
                    generations_without_improvement += 1
                
                ### If stuck, inject random individuals
                if generations_without_improvement > 3:
                    logger.info("Injecting random individuals to increase diversity")
                    population = population[:self.ELITE_SIZE] + [self.generate_individual() for _ in range(self.POP_SIZE - self.ELITE_SIZE)]
                    generations_without_improvement = 0
                
                ### Log best individual and store unique blends
                best_ind = population[0]
                indices, ratios = best_ind[:3], best_ind[3:]
                coal_names = [self.coal_names[i] for i in indices]
                logger.info(f"Best in generation {gen+1}: {coal_names} with ratios {ratios}")
                
                ### Store unique blend for this generation
                blend_key = (tuple(sorted(indices)), tuple(sorted(ratios)))
                if blend_key not in self._all_unique_blends:
                    self._all_unique_blends.add(blend_key)
                
                ### Create new population
                new_pop = population[:self.ELITE_SIZE]
                while len(new_pop) < self.POP_SIZE:
                    p1 = self._tournament_selection(population[:50])
                    p2 = self._tournament_selection(population[:50])
                    child = self._crossover(p1, p2)
                    child = self._mutate(child)
                    new_pop.append(child)
                population = new_pop

            if best_solution is None:
                raise ValueError("No valid solution found during optimization")

            ### Get final result
            indices, ratios = best_solution[:3], best_solution[3:]
            coal_names = [self.coal_names[i] for i in indices]
            cost = float(self.compute_cost(indices, ratios))
            blend_features = self.get_blend_features(tuple(indices), tuple(ratios))
            preds = self.predict_properties(blend_features)

            logger.info(f"Optimization completed. Best solution: {coal_names} with ratios {ratios}")
            logger.info(f"Total unique blends found: {len(self._all_unique_blends)}")

            ### Convert all numpy types to Python native types
            result = {
                "blend_combinations": [{
                    "coals": [
                        {"name": str(name), "percentage": int(ratio)}
                        for name, ratio in zip(coal_names, ratios)
                    ],
                    "predicted": {
                        "ash": float(preds[0]),
                        "vm": float(preds[1]),
                        "fc": float(preds[2]),
                        "csn": float(preds[3]),
                        "cri": float(preds[4]),
                        "csr": float(preds[5]),
                        "ash_final": float(preds[6]),
                        "vm_final": float(preds[7])
                    },
                    "cost": float(cost)
                }],
                "total_cost": float(cost),
                "all_unique_blends": []
            }

            ### Add all unique blends to the result
            for blend_key in self._all_unique_blends:
                indices, ratios = blend_key
                coal_names = [self.coal_names[i] for i in indices]
                blend_features = self.get_blend_features(tuple(indices), tuple(ratios))
                preds = self.predict_properties(blend_features)
                cost = float(self.compute_cost(list(indices), list(ratios)))
                
                result["all_unique_blends"].append({
                    "coals": [
                        {"name": str(name), "percentage": int(ratio)}
                        for name, ratio in zip(coal_names, ratios)
                    ],
                    "predicted": {
                        "ash": float(preds[0]),
                        "vm": float(preds[1]),
                        "fc": float(preds[2]),
                        "csn": float(preds[3]),
                        "cri": float(preds[4]),
                        "csr": float(preds[5]),
                        "ash_final": float(preds[6]),
                        "vm_final": float(preds[7])
                    },
                    "total_cost": float(cost)
                })

            return result
        except Exception as e:
            logger.error(f"Error in optimization: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise

    def _update_constraints(self, custom_constraints: Dict) -> None:
        """Update constraints with custom values."""
        if 'blend' in custom_constraints:
            self.constraints['blend'].update(custom_constraints['blend'])
        if 'coke' in custom_constraints:
            self.constraints['coke'].update(custom_constraints['coke'])
        logger.info(f"Updated constraints: {self.constraints}")

    def _tournament_selection(self, population: List[List[Any]]) -> List[Any]:
        """Tournament selection for parent selection."""
        tournament = random.sample(population, self.TOURNAMENT_SIZE)
        return min(tournament, key=self.fitness)

    def _crossover(self, parent1: List[Any], parent2: List[Any]) -> List[Any]:
        """Optimized crossover operation."""
        idx = random.randint(1, 2)
        indices = list(dict.fromkeys(parent1[:idx] + parent2[idx:3]))
        while len(indices) < 3:
            new_index = random.choice([i for i in range(len(self.coal_df)) if i not in indices])
            indices.append(new_index)
        ### Use pre-computed valid ratios instead of random ones
        ratios = list(random.choice(self.NONZERO_RATIO_POOL))
        return indices + ratios

    def _mutate(self, ind: List[Any]) -> List[Any]:
        """Enhanced mutation operation."""
        indices, ratios = ind[:3], ind[3:]
        mutated = False
        
        ######### Mutate indices
        if random.random() < self.MUTATION_RATE:
            while True:
                new_idx = random.randint(0, len(self.coal_df) - 1)
                i = random.randint(0, 2)
                indices[i] = new_idx
                if len(set(indices)) == 3:
                    mutated = True
                    break
        
        ######### Mutate ratios - always use pre-computed valid ratios
        if random.random() < self.MUTATION_RATE:
            ratios = list(random.choice(self.NONZERO_RATIO_POOL))
            mutated = True
        
        ######### If no mutation occurred, force a small change
        if not mutated:
            ######### Either change one ratio or swap two indices
            if random.random() < 0.5:
                ######### Use pre-computed valid ratios instead of modifying existing ones
                ratios = list(random.choice(self.NONZERO_RATIO_POOL))
            else:
                ######### Swap two indices
                i, j = random.sample(range(3), 2)
                indices[i], indices[j] = indices[j], indices[i]
        
        return indices + ratios