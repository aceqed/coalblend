import pandas as pd
import numpy as np
import random
import joblib
import logging

logger = logging.getLogger(__name__)

class CoalBlendOptimizer:
    def __init__(self, model_path, coal_data):
        self.model = joblib.load(model_path)
        self.coal_data = coal_data
        self.population_size = 100
        self.n_generations = 50
        self.mutation_rate = 0.2
        self.crossover_rate = 0.8
        self.population = []
        
        # Default constraints
        self.default_constraints = {
            'blend': {
                'vm': (20, 30),
                'fc': (50, 60),
                'ash': (8, 12),
                'csn': (0.4, 0.8)
            },
            'coke': {
                'cri': (0.5, 1.5),
                'csr': (60, 75),
                'vm': (0.5, 1.5),
                'ash': (0.5, 1.5)
            }
        }
        self.constraints = self.default_constraints

    def optimize(self, custom_constraints=None, stop_check=None):
        """
        Run the genetic algorithm optimization with custom constraints.
        
        Args:
            custom_constraints (dict): Custom constraints for blend and coke properties
            stop_check (callable): Function to check if optimization should stop
            
        Returns:
            dict: Optimization results including blend combinations and predictions
        """
        try:
            # Use custom constraints if provided, otherwise use defaults
            self.constraints = custom_constraints if custom_constraints else self.default_constraints
            
            # Initialize population
            self.population = self._initialize_population()
            
            # Run genetic algorithm
            for generation in range(self.n_generations):
                # Check if should stop
                if stop_check and stop_check():
                    logger.info("Optimization stopped by user request")
                    return None
                    
                # Evaluate fitness
                fitness_scores = [self._fitness(individual) for individual in self.population]
                
                # Sort population by fitness
                sorted_population = [x for _, x in sorted(zip(fitness_scores, self.population))]
                
                # Select parents
                parents = self._select_parents(sorted_population)
                
                # Create new generation
                new_population = []
                while len(new_population) < self.population_size:
                    # Crossover
                    if random.random() < self.crossover_rate:
                        parent1, parent2 = random.sample(parents, 2)
                        child = self._crossover(parent1, parent2)
                    else:
                        child = random.choice(parents)
                    
                    # Mutation
                    if random.random() < self.mutation_rate:
                        child = self._mutate(child)
                    
                    new_population.append(child)
                
                self.population = new_population
                
                # Log progress
                if (generation + 1) % 10 == 0:
                    best_fitness = min(fitness_scores)
                    logger.info(f"Generation {generation + 1}, Best Fitness: {best_fitness}")
            
            # Get best solution
            best_individual = min(self.population, key=self._fitness)
            best_fitness = self._fitness(best_individual)
            
            # Convert best solution to blend combinations
            blend_combinations = self._convert_to_blend_combinations(best_individual)
            
            return {
                "fitness": best_fitness,
                "blend_combinations": blend_combinations
            }
            
        except Exception as e:
            logger.error(f"Error in optimization: {str(e)}")
            raise

    def _initialize_population(self):
        """Initialize the population with random coal blends."""
        population = []
        for _ in range(self.population_size):
            # Select random coals
            selected_coals = self.coal_data.sample(n=3)
            
            # Generate random percentages that sum to 100
            percentages = np.random.dirichlet(np.ones(3)) * 100
            
            # Create individual
            individual = {
                'coals': selected_coals['Name_of_coal'].tolist(),
                'percentages': percentages.tolist()
            }
            population.append(individual)
        
        return population

    def _fitness(self, individual):
        """Calculate fitness of an individual."""
        try:
            # Get blend properties
            blend_props = self._calculate_blend_properties(individual)
            
            # Get coke properties
            coke_props = self._calculate_coke_properties(individual)
            
            # Calculate penalty for constraint violations
            penalty = 0
            
            # Check blend constraints
            for prop, (min_val, max_val) in self.constraints['blend'].items():
                if prop in blend_props:
                    val = blend_props[prop]
                    if val < min_val:
                        penalty += (min_val - val) ** 2
                    elif val > max_val:
                        penalty += (val - max_val) ** 2
            
            # Check coke constraints
            for prop, (min_val, max_val) in self.constraints['coke'].items():
                if prop in coke_props:
                    val = coke_props[prop]
                    if val < min_val:
                        penalty += (min_val - val) ** 2
                    elif val > max_val:
                        penalty += (val - max_val) ** 2
            
            # Calculate cost
            cost = self._calculate_cost(individual)
            
            return cost + penalty * 1000  # Weight penalty heavily
            
        except Exception as e:
            logger.error(f"Error in fitness calculation: {str(e)}")
            return float('inf')

    def _select_parents(self, sorted_population):
        """Select parents for next generation using tournament selection."""
        parents = []
        for _ in range(self.population_size):
            # Tournament selection
            tournament = random.sample(sorted_population, 3)
            winner = min(tournament, key=self._fitness)
            parents.append(winner)
        return parents

    def _crossover(self, parent1, parent2):
        """Perform crossover between two parents."""
        # Randomly select coals from both parents
        child_coals = []
        child_percentages = []
        
        # Get all unique coals
        all_coals = list(set(parent1['coals'] + parent2['coals']))
        
        # Randomly select 3 coals
        selected_coals = random.sample(all_coals, min(3, len(all_coals)))
        
        # Generate new percentages
        percentages = np.random.dirichlet(np.ones(len(selected_coals))) * 100
        
        return {
            'coals': selected_coals,
            'percentages': percentages.tolist()
        }

    def _mutate(self, individual):
        """Apply mutation to an individual."""
        mutated = individual.copy()
        
        # Mutate coal selection
        if random.random() < self.mutation_rate:
            # Replace one coal
            idx = random.randrange(len(mutated['coals']))
            new_coal = self.coal_data.sample(n=1)['Name_of_coal'].iloc[0]
            mutated['coals'][idx] = new_coal
        
        # Mutate percentages
        if random.random() < self.mutation_rate:
            # Generate new percentages
            percentages = np.random.dirichlet(np.ones(len(mutated['coals']))) * 100
            mutated['percentages'] = percentages.tolist()
        
        return mutated

    def _calculate_blend_properties(self, individual):
        """Calculate blend properties for an individual."""
        blend_props = {}
        
        # Get coal data for selected coals
        coal_data = self.coal_data[self.coal_data['Name_of_coal'].isin(individual['coals'])]
        
        # Calculate weighted average for each property
        for prop in ['Ash', 'VM_weight', 'FC', 'CSN']:
            if prop in coal_data.columns:
                weighted_sum = sum(
                    p * coal_data[coal_data['Name_of_coal'] == c][prop].iloc[0]
                    for c, p in zip(individual['coals'], individual['percentages'])
                )
                blend_props[prop.lower()] = weighted_sum / 100
        
        return blend_props

    def _calculate_coke_properties(self, individual):
        """Calculate coke properties for an individual."""
        # Prepare input for model
        blend_props = self._calculate_blend_properties(individual)
        input_data = pd.DataFrame([blend_props])
        
        # Make prediction
        predictions = self.model.predict(input_data)
        
        # Map predictions to properties
        coke_props = {
            'cri': predictions[0][0],
            'csr': predictions[0][1],
            'ash': predictions[0][2],
            'vm': predictions[0][3]
        }
        
        return coke_props

    def _calculate_cost(self, individual):
        """Calculate cost of the blend."""
        # Get coal data for selected coals
        coal_data = self.coal_data[self.coal_data['Name_of_coal'].isin(individual['coals'])]
        
        # Calculate weighted cost
        cost = sum(
            p * coal_data[coal_data['Name_of_coal'] == c]['Cost'].iloc[0]
            for c, p in zip(individual['coals'], individual['percentages'])
        )
        
        return cost / 100

    def _convert_to_blend_combinations(self, individual):
        """Convert best individual to blend combinations format."""
        # Calculate properties
        blend_props = self._calculate_blend_properties(individual)
        coke_props = self._calculate_coke_properties(individual)
        
        # Create blend combination
        blend = {
            "coals": [
                {
                    "name": coal,
                    "percentage": percentage
                }
                for coal, percentage in zip(individual['coals'], individual['percentages'])
            ],
            "predicted": {
                "ash": blend_props.get('ash', 0),
                "vm": blend_props.get('vm_weight', 0),
                "fc": blend_props.get('fc', 0),
                "csn": blend_props.get('csn', 0),
                "cri": coke_props.get('cri', 0),
                "csr": coke_props.get('csr', 0),
                "ash_final": coke_props.get('ash', 0),
                "vm_final": coke_props.get('vm', 0)
            }
        }
        
        return [blend] 