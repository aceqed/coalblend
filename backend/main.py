import os
from fastapi import FastAPI, Depends, HTTPException, status, Response, BackgroundTasks, UploadFile, File, Form
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, EmailStr
from datetime import timedelta, datetime
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List, Dict, Optional
import joblib
import numpy as np
from genetic_algorithm import CoalBlendOptimizer
import pandas as pd
import asyncio
import traceback
import PyPDF2
from typing import Dict, Any
import io
import re
from format import json_schema
import json
import re
from pathlib import Path
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
import models
import schemas
import auth
from database import engine, get_db
from inference_engine import CoalBlendInferenceEngine

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255))
    # Add other user attributes

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db;
    finally:
        db.close()

# FastAPI app
app = FastAPI(title="User Authentication API")

# Add CORS middleware with specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"]
)

# Create database tables
# models.Base.metadata.create_all(bind=engine)

# Login request model
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Load the prediction models
def load_models():
    models_dir = os.path.join(os.path.dirname(__file__), "Models")
    try:
        # Load the single model that takes 22 inputs and gives 8 outputs
        with open(os.path.join(models_dir, "multioutput_rf_model.pkl"), "rb") as f:
            model = joblib.load(f)
        return model
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

# Load model at startup
prediction_model = load_models()

# Initialize inference engine
def load_inference_engine():
    models_dir = os.path.join(os.path.dirname(__file__), "Models")
    try:
        inference_engine = CoalBlendInferenceEngine(models_dir)
        return inference_engine
    except Exception as e:
        logger.error(f"Error loading inference engine: {str(e)}")
        raise

# Load inference engine at startup
inference_engine = load_inference_engine()

# Add a global dictionary to track running simulations
running_simulations = {}

# @app.post("/test-cors")
# def test_cors():
#     return {"message": "CORS works!"}

# fixed carbon fc , s->sulphur , n->nitrogen ,
def calculate_emissions(fc, ash, vm, s, n, cri, csr):
    emissions = {}

    # CO2
    emissions["CO2_Emissions"] = 0.7 * (fc / 100) * (44.01 / 12.01) * 1000
    # CO
    emissions["CO_Emissions"] = 0.3 * (fc / 100) * (28.01 / 12.01) * 1000
    # SO2
    emissions["SO2_Emissions"] = (s / 100) * (64.07 / 32.06) * 1000
    # NO
    emissions["NO_Emissions"] = 0.2 * (n / 100) * (30.01 / 14.01) * 1000
    # NO2
    emissions["NO2_Emissions"] = 0.2 * (n / 100) * (46.01 / 14.01) * 1000

    # PM Index
    pm_index = 0.4 * (ash / 9) + 0.3 * (cri / 28) + 0.3 * (1 - csr / 65)
    emissions["PM_Index"] = pm_index
    emissions["PM10_Emissions"] = 0.7 * pm_index
    emissions["PM25_Emissions"] = 0.3 * pm_index

    # VOC Index
    voc_index = 0.5 * (vm / 2.5) + 0.2 * (cri / 28) + 0.2 * (1 - csr / 65) + 0.1 * (n / 1.0)
    emissions["VOC_Index"] = voc_index
    emissions["VOC_Emissions"] = 0.9 * voc_index
    emissions["PAH_Emissions"] = 0.1 * voc_index

    return emissions



    """Helper function to parse coal properties from text."""
    def extract_number(pattern, text):
        import re
        match = re.search(fr'{pattern}\s*[:=]?\s*([\d.]+)', text, re.IGNORECASE)
        return float(match.group(1)) if match else None

    return {
        "IM": extract_number(r'(?:Inherent\s+Moisture|IM)', text),
        "Ash": extract_number(r'Ash', text),
        "VM": extract_number(r'(?:Volatile\s+Matter|VM)', text),
        "FC": extract_number(r'(?:Fixed\s+Carbon|FC)', text),
        "S": extract_number(r'(?:Sulphur|Sulfur|S)', text),
        "P": extract_number(r'(?:Phosphorus|P)', text),
        "SiO2": extract_number(r'SiO2', text),
        "Al2O3": extract_number(r'Al2O3', text),
        "Fe2O3": extract_number(r'Fe2O3', text),
        "CaO": extract_number(r'CaO', text),
        "MgO": extract_number(r'MgO', text),
        "Na2O": extract_number(r'Na2O', text),
        "K2O": extract_number(r'K2O', text),
        "TiO2": extract_number(r'TiO2', text),
        "Mn3O4": extract_number(r'Mn3O4', text),
        "SO3": extract_number(r'SO3', text),
        "P2O5": extract_number(r'P2O5', text),
        "CRI": extract_number(r'CRI', text),
        "CSR": extract_number(r'CSR', text),
        "N": extract_number(r'(?:Nitrogen|N)', text),
    }

def parse_coal_properties(text: str) -> dict:
    """Helper function to parse coal properties from text."""
    def extract_number(pattern, text):
        import re
        import math
        
        match = re.search(fr'{pattern}\s*[:=]?\s*([\d.]+)', text, re.IGNORECASE)
        if not match:
            return None
            
        try:
            value = float(match.group(1))
            # Validate the value is a finite number
            if not math.isfinite(value):
                return None
            # Round to 6 decimal places to avoid floating point precision issues
            return round(value, 6)
        except (ValueError, TypeError):
            return None

    # Parse all properties
    result = {
        "IM": extract_number(r'(?:Inherent\s+Moisture|IM)', text),
        "Ash": extract_number(r'Ash', text),
        "VM": extract_number(r'(?:Volatile\s+Matter|VM)', text),
        "FC": extract_number(r'(?:Fixed\s+Carbon|FC)', text),
        "S": extract_number(r'(?:Sulphur|Sulfur|S)', text),
        "P": extract_number(r'(?:Phosphorus|P)', text),
        "SiO2": extract_number(r'SiO2', text),
        "Al2O3": extract_number(r'Al2O3', text),
        "Fe2O3": extract_number(r'Fe2O3', text),
        "CaO": extract_number(r'CaO', text),
        "MgO": extract_number(r'MgO', text),
        "Na2O": extract_number(r'Na2O', text),
        "K2O": extract_number(r'K2O', text),
        "TiO2": extract_number(r'TiO2', text),
        "Mn3O4": extract_number(r'Mn3O4', text),
        "SO3": extract_number(r'SO3', text),
        "P2O5": extract_number(r'P2O5', text),
        "BaO": extract_number(r'BaO', text),
        "SrO": extract_number(r'SrO', text),
        "ZnO": extract_number(r'ZnO', text),
        "CRI": extract_number(r'CRI', text),
        "CSR": extract_number(r'CSR', text),
        "N": extract_number(r'(?:Nitrogen|N)', text),
        "HGI": extract_number(r'HGI', text),
        "Vitrinite": extract_number(r'Vitrinite', text),
        "Liptinite": extract_number(r'Liptinite', text),
        "Semi_Fusinite": extract_number(r'Semi_Fusinite', text),
        "CSN_FSI": extract_number(r'CSN_FSI', text),
        "Initial_Softening_Temp": extract_number(r'Initial_Softening_Temp', text),
        "MBI": extract_number(r'MBI', text),
        "CBI": extract_number(r'CBI', text),
        "Log_Max_Fluidity": extract_number(r'Log_Max_Fluidity', text),
        "C": extract_number(r'C', text),
        "H": extract_number(r'H', text),
        "O": extract_number(r'O', text),
        "ss": extract_number(r'ss', text),
        # Vitrinite reflectance values (V7 to V19)
        "V7": extract_number(r'V7', text),
        "V8": extract_number(r'V8', text),
        "V9": extract_number(r'V9', text),
        "V10": extract_number(r'V10', text),
        "V11": extract_number(r'V11', text),
        "V12": extract_number(r'V12', text),
        "V13": extract_number(r'V13', text),
        "V14": extract_number(r'V14', text),
        "V15": extract_number(r'V15', text),
        "V16": extract_number(r'V16', text),
        "V17": extract_number(r'V17', text),
        "V18": extract_number(r'V18', text),
        "V19": extract_number(r'V19', text),
        # Additional properties for CBI and Log Max Fluidity calculations
        "Inertinite": extract_number(r'Inertinite', text),
        "Minerals": extract_number(r'Minerals', text),
        "Max_Fluidity_ddpm": extract_number(r'Max_Fluidity_ddpm', text),
    }
    
    # Remove None values
    return {k: v for k, v in result.items() if v is not None}



@app.post("/register")
def register_user(user: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
    logger.info(f"Registering user with email: {user.email}")
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create access token for the new user
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    # Set cookie with JWT token
    response.set_cookie(
        key="auth_token",
        value=access_token,  # Store just the token without Bearer prefix
        httponly=True,  # Prevents JavaScript access to the cookie
        secure=False,    # Set to True in production with HTTPS
        samesite="lax", # Protects against CSRF
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert minutes to seconds
        path="/"        # Cookie is available for all paths
    )

    logger.info(f"User registered successfully: {db_user.email}")
    return {
        "message": "Registration successful",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/login")
async def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for email: {login_data.email}")
    # Find user by email
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    logger.info(f"User found: {user}")
    
    # Verify user exists and password is correct
    if not user or not auth.verify_password(login_data.password, user.hashed_password):
        logger.warning(f"Login failed for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
     
    # Create access token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    # Set cookie with JWT token
    response.set_cookie(
        key="auth_token",
        value=access_token,  # Store just the token without Bearer prefix
        httponly=True,  # Prevents JavaScript access to the cookie
        secure=False,    # Set to True in production with HTTPS
        samesite="lax", # Protects against CSRF
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert minutes to seconds
        path="/"        # Cookie is available for all paths
    )

    logger.info(f"Login successful for user: {user.email}")
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/logout")
async def logout(response: Response):
    # Clear the auth token cookie
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        samesite="lax",
        secure=True
    )
    return {"message": "Successfully logged out"}

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/predict")
async def predict_blend(
    prediction_input: schemas.PredictionInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        logger.info(f"Processing prediction request for user: {current_user.email}")
        logger.info(f"Input blends: {prediction_input.blends}")
        
        # Validate total percentage equals 100
        total_percentage = sum(blend.percentage for blend in prediction_input.blends)
        if abs(total_percentage - 100) > 0.01:  # Allow for small floating point differences
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total percentage must equal 100%"
            )

        # Get properties for all coals in the blend
        coal_properties = {}
        for blend in prediction_input.blends:
            coal = db.query(models.CoalProperties).filter(
                models.CoalProperties.coal_name == blend.coal_name
            ).first()
            
            if not coal:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Coal properties not found for: {blend.coal_name}"
                )
            
            coal_properties[blend.coal_name] = coal
            logger.info(f"\nCoal Properties for {blend.coal_name} ({blend.percentage}%):")
            logger.info(f"IM: {coal.IM}")
            logger.info(f"Ash: {coal.Ash}")
            logger.info(f"VM: {coal.VM}")
            logger.info(f"FC: {coal.FC}")
            logger.info(f"S: {coal.S}")
            logger.info(f"P: {coal.P}")
            logger.info(f"SiO2: {coal.SiO2}")
            logger.info(f"Al2O3: {coal.Al2O3}")
            logger.info(f"Fe2O3: {coal.Fe2O3}")
            logger.info(f"CaO: {coal.CaO}")
            logger.info(f"MgO: {coal.MgO}")
            logger.info(f"Na2O: {coal.Na2O}")
            logger.info(f"K2O: {coal.K2O}")
            logger.info(f"TiO2: {coal.TiO2}")
            logger.info(f"Mn3O4: {coal.Mn3O4}")
            logger.info(f"SO3: {coal.SO3}")
            logger.info(f"P2O5: {coal.P2O5}")
            logger.info(f"BaO: {coal.BaO}")
            logger.info(f"SrO: {coal.SrO}")
            logger.info(f"ZnO: {coal.ZnO}")
            logger.info(f"CRI: {coal.CRI}")
            logger.info(f"CSR: {coal.CSR}")
            logger.info(f"N:{coal.N}")
            logger.info(f"HGI: {coal.HGI}")
            logger.info(f"Coal Category: {coal.coal_category}")

        # ========================================
        # Use the inference engine for complete prediction
        # ========================================
        logger.info("\n=== Using Inference Engine for Complete Prediction ===")
    
        
        # Convert blend input to the format expected by inference engine
        blend_ratios = [{"coal_name": blend.coal_name, "percentage": blend.percentage} 
                       for blend in prediction_input.blends]
        
        # Run complete inference pipeline
        inference_results = inference_engine.run_inference(coal_properties, blend_ratios)
        
        # Extract results
        # enhanced_blend_properties = inference_results["final_features"]
        # predicted_targets = inference_results["predicted_targets"]
        # emissions = inference_results["emissions"]
        enhanced_blend_properties = inference_results["final_features"]
        predicted_targets = inference_results["predicted_targets"]
        emissions = inference_results["emissions"]
        
        # Format predictions for response
        predicted_coal_properties = {
            "ash_percent": predicted_targets.get("ASH", 0.0),
            "vm_percent": predicted_targets.get("VM", 0.0),
            "fc_percent": 100 - predicted_targets.get("ASH", 0.0) - predicted_targets.get("VM", 0.0),
            "CSN": 0.0  # Not predicted in current model
        }
        
        predicted_coke_properties = {
            "CRI": predicted_targets.get("CRI", 0.0),
            "CSR": predicted_targets.get("CSR", 0.0),
            "ASH": predicted_targets.get("ASH", 0.0),
            "VM": predicted_targets.get("VM", 0.0),
            "N": enhanced_blend_properties.get("weighted_N", 0.0) * 100 * 0.1,
            "S": enhanced_blend_properties.get("weighted_S", 0.0) * 100 * 0.85,
            "P": enhanced_blend_properties.get("weighted_P", 0.0) * 100 * 0.9,
            "FC": 100 - predicted_targets.get("ASH", 0.0) - predicted_targets.get("VM", 0.0),
        }
        
        # logger.info("=== Inference Engine Prediction completed successfully ===")
        # logger.info(f"Predicted targets: {predicted_targets}")
        # logger.info(f"Emissions: {emissions}")

        # Create response using the schema
        response = schemas.PredictionOutput(
            blend_properties=enhanced_blend_properties,
            predicted_coke_properties=predicted_coke_properties,
            predicted_coal_properties=predicted_coal_properties
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in predict_blend: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during prediction: {str(e)}"
        )

@app.get("/verify-token")
async def verify_token(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name
        }
    }

@app.post("/simulation", response_model=schemas.SimulationResponse)
async def create_simulation(
    simulation: schemas.SimulationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        logger.info("Creating new simulation")
        
        # Create simulation record with explicit running status
        db_simulation = models.Simulation(
            user_id=current_user.id,
            scenario_name=simulation.scenario_name,
            scenario_description=simulation.scenario_description,
            status="running",  # Explicitly set status to running
            generated_date=datetime.now()
        )
        db.add(db_simulation)
        db.commit()
        db.refresh(db_simulation)

        logger.info(f"Created simulation with ID: {db_simulation.id} and status: {db_simulation.status}")

        # Save coke properties
        coke_properties = []
        for prop in simulation.coke_properties:
            db_prop = models.SimulationProperties(
                simulation_id=db_simulation.id,
                property_type="coke",
                property_name=prop.property_name,
                min_value=prop.min_value,
                max_value=prop.max_value
            )
            db.add(db_prop)
            db.flush()  # Flush to get the ID
            coke_properties.append({
                "id": db_prop.id,
                "simulation_id": db_simulation.id,
                "property_type": "coke",
                "property_name": prop.property_name,
                "min_value": prop.min_value,
                "max_value": prop.max_value
            })

        # Save blend properties
        blend_properties = []
        for prop in simulation.blend_properties:
            db_prop = models.SimulationProperties(
                simulation_id=db_simulation.id,
                property_type="blend",
                property_name=prop.property_name,
                min_value=prop.min_value,
                max_value=prop.max_value
            )
            db.add(db_prop)
            db.flush()  # Flush to get the ID
            blend_properties.append({
                "id": db_prop.id,
                "simulation_id": db_simulation.id,
                "property_type": "blend",
                "property_name": prop.property_name,
                "min_value": prop.min_value,
                "max_value": prop.max_value
            })

        db.commit()
        logger.info(f"Saved properties for simulation {db_simulation.id}")

        # Create response object with all required fields
        response_data = {
            "id": db_simulation.id,
            "user_id": db_simulation.user_id,
            "scenario_name": db_simulation.scenario_name,
            "scenario_description": db_simulation.scenario_description,
            "status": db_simulation.status,
            "generated_date": db_simulation.generated_date,
            "coke_properties": coke_properties,
            "blend_properties": blend_properties,
            "recommendations": []  # Empty list for new simulation
        }

        return response_data

    except Exception as e:
        logger.error(f"Error creating simulation: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating simulation: {str(e)}"
        )

@app.post("/simulation/{simulation_id}/stop")
async def stop_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Stop a running simulation."""
    try:
        # Get simulation from database
        db_simulation = db.query(models.Simulation).filter(models.Simulation.id == simulation_id).first()
        if not db_simulation:
            raise HTTPException(status_code=404, detail="Simulation not found")
            
        if db_simulation.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to stop this simulation")
            
        if db_simulation.status != "running":
            raise HTTPException(status_code=400, detail="Simulation is not running")
            
        # Set stop flag in running_simulations
        if simulation_id in running_simulations:
            running_simulations[simulation_id]["stop_requested"] = True
            logger.info(f"Stop requested for simulation {simulation_id}")
            
            # Update simulation status in database
            db_simulation.status = "failed"
            db_simulation.error_message = "Simulation stopped by user"
            db.commit()
            
            # Remove from running simulations
            running_simulations.pop(simulation_id, None)
            
            return {"message": "Stop request received", "status": "failed"}
        else:
            # If simulation is not in running_simulations but status is running,
            # just update the status
            db_simulation.status = "failed"
            db_simulation.error_message = "Simulation stopped by user"
            db.commit()
            return {"message": "Simulation marked as failed", "status": "failed"}
            
    except Exception as e:
        logger.error(f"Error stopping simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_optimization(simulation_id: int, simulation_data: dict, db: Session):
    try:
        logger.info(f"Starting optimization process for simulation {simulation_id}")
        
        # Initialize simulation tracking
        running_simulations[simulation_id] = {
            "stop_requested": False,
            "start_time": datetime.now()
        }
        
        # Get simulation from database
        db_simulation = db.query(models.Simulation).filter_by(id=simulation_id).first()
        if not db_simulation:
            logger.error(f"Simulation {simulation_id} not found")
            return

        # Ensure status is running
        db_simulation.status = "running"
        db.commit()
        
        # Convert constraints to the format expected by the optimizer
        custom_constraints = {
            'blend': {},
            'coke': {}
        }
        
        # Convert blend properties
        for prop in simulation_data.get('blend_properties', []):
            custom_constraints['blend'][prop['property_name']] = (
                float(prop['min_value']),
                float(prop['max_value'])
            )
            
        # Convert coke properties
        for prop in simulation_data.get('coke_properties', []):
            custom_constraints['coke'][prop['property_name']] = (
                float(prop['min_value']),
                float(prop['max_value'])
            )
            
        # Get coal data from database
        coal_data = db.query(models.CoalProperties).all()
        logger.info(f"Retrieved {len(coal_data)} coal entries from database")

        if not coal_data:
            raise ValueError("No coal data found in database")

        # Create DataFrame from coal data
        coal_df = pd.DataFrame([{
            'Name_of_coal': coal.coal_name,
            'IM': coal.IM,
            'Ash': coal.Ash,
            'VM_weight': coal.VM,
            'FC': coal.FC,
            'S': coal.S,
            'P': coal.P,
            'SiO2': coal.SiO2,
            'Al2O3': coal.Al2O3,
            'Fe2O3': coal.Fe2O3,
            'CaO': coal.CaO,
            'MgO': coal.MgO,
            'Na2O': coal.Na2O,
            'K2O': coal.K2O,
            'TiO2': coal.TiO2,
            'Mn3O4': coal.Mn3O4,
            'SO3': coal.SO3,
            'P2O5': coal.P2O5,
            'BaO': coal.BaO,
            'SrO': coal.SrO,
            'ZnO': coal.ZnO,
            'CRI_weight': coal.CRI,
            'CSR_weight': coal.CSR,
            'N': coal.N,
            'Cost': coal.cost if hasattr(coal, 'cost') else 1000  # Use cost from DB if available
        } for coal in coal_data])

        logger.info(f"Created DataFrame with shape: {coal_df.shape}")
        
        # Initialize optimizer
        model_path = os.path.join(os.path.dirname(__file__), "Models", "multioutput_rf_model.pkl")
        optimizer = CoalBlendOptimizer(model_path, coal_df)
        
        # Define stop check function
        def check_stop():
            if simulation_id not in running_simulations:
                return True
            return running_simulations[simulation_id].get("stop_requested", False)
        
        # Run optimization
        result = optimizer.optimize(custom_constraints=custom_constraints, stop_check=check_stop)
        
        # Check if optimization was stopped
        if result is None:
            logger.info(f"Optimization stopped for simulation {simulation_id}")
            return
            
        # Store all unique blends in simulationCoalRecommendations
        if isinstance(result, dict) and "all_unique_blends" in result:
            # Store each unique blend as a separate row
            for blend in result["all_unique_blends"]:
                # Initialize coal percentages with zeros for all coals
                coal_percentages = {
                    "Metropolitan": 0.0,
                    "Lake Vermont": 0.0,
                    "PDN": 0.0,
                    "Riverside": 0.0,
                    "Poitrel": 0.0,
                    "Illawara (PHCC)": 0.0,
                    "Teck Venture": 0.0,
                    "Leer": 0.0,
                    "Daunia (SHCC)": 0.0,
                    "Mt. Laurel": 0.0,
                    "Moranbah North": 0.0,
                    "R.PCI": 0.0,
                    "Eagle crrek": 0.0,
                    "Goonyella": 0.0,
                    "Blue creek": 0.0,
                    "Scratch Coal": 0.0,
                    "Dhamra SHCC PDN": 0.0,
                    "Elga": 0.0,
                    "Low Ash SHCC/ SHCC-BHP": 0.0,
                    "Leer/Russian HFCC": 0.0,
                    "Indonasian": 0.0,
                    "Uvalnaya": 0.0,
                    "Caval Ridge": 0.0,
                    "Amonate": 0.0,
                    "Aus.SHCC": 0.0,
                    "Indian Coal Dhanbaad": 0.0
                }
                
                # Update percentages for coals in this blend
                for coal in blend["coals"]:
                    coal_percentages[coal["name"]] = coal["percentage"]
                    
                
                
                    
                
                # Create new recommendation entry with predicted values
                recommendation = models.SimulationCoalRecommendations(
                    simulation_id=simulation_id,
                    coal_percentages=coal_percentages,
                    predicted_ash=blend["predicted"]["ash"],
                    predicted_vm=blend["predicted"]["vm"],
                    predicted_fc=blend["predicted"]["fc"],
                    predicted_csn=blend["predicted"]["csn"],
                    predicted_cri=blend["predicted"]["cri"],
                    predicted_csr=blend["predicted"]["csr"],
                    predicted_ash_final=blend["predicted"]["ash_final"],
                    predicted_vm_final=blend["predicted"]["vm_final"],
                    total_cost=blend.get("cost", 0.0)
                )
                db.add(recommendation)
            
            # Also store the best blend as a separate row
            best_blend = result["blend_combinations"][0]
            best_coal_percentages = {
                "Metropolitan": 0.0,
                "Lake Vermont": 0.0,
                "PDN": 0.0,
                "Riverside": 0.0,
                "Poitrel": 0.0,
                "Illawara (PHCC)": 0.0,
                "Teck Venture": 0.0,
                "Leer": 0.0,
                "Daunia (SHCC)": 0.0,
                "Mt. Laurel": 0.0,
                "Moranbah North": 0.0,
                "R.PCI": 0.0,
                "Eagle crrek": 0.0,
                "Goonyella": 0.0,
                "Blue creek": 0.0,
                "Scratch Coal": 0.0,
                "Dhamra SHCC PDN": 0.0,
                "Elga": 0.0,
                "Low Ash SHCC/ SHCC-BHP": 0.0,
                "Leer/Russian HFCC": 0.0,
                "Indonasian": 0.0,
                "Uvalnaya": 0.0,
                "Caval Ridge": 0.0,
                "Amonate": 0.0,
                "Aus.SHCC": 0.0,
                "Indian Coal Dhanbaad": 0.0
            }
            
            # Update percentages for coals in best blend
            for coal in best_blend["coals"]:
                best_coal_percentages[coal["name"]] = coal["percentage"]
            
            best_recommendation = models.SimulationCoalRecommendations(
                simulation_id=simulation_id,
                coal_percentages=best_coal_percentages,
                predicted_ash=best_blend["predicted"]["ash"],
                predicted_vm=best_blend["predicted"]["vm"],
                predicted_fc=best_blend["predicted"]["fc"],
                predicted_csn=best_blend["predicted"]["csn"],
                predicted_cri=best_blend["predicted"]["cri"],
                predicted_csr=best_blend["predicted"]["csr"],
                predicted_ash_final=best_blend["predicted"]["ash_final"],
                predicted_vm_final=best_blend["predicted"]["vm_final"],
                total_cost=best_blend.get("cost", 0.0)
            )
            db.add(best_recommendation)
        
        # Update simulation status
        db_simulation.status = "completed"
        db.commit()
        
        # Remove from running simulations
        running_simulations.pop(simulation_id, None)
        
    except Exception as e:
        logger.error(f"Error in optimization process: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Update simulation status to failed
        db_simulation = db.query(models.Simulation).filter_by(id=simulation_id).first()
        if db_simulation:
            db_simulation.status = "failed"
            db_simulation.error_message = str(e)
            db.commit()
            
        # Remove from running simulations
        running_simulations.pop(simulation_id, None)

@app.post("/simulation/{simulation_id}/start")
async def start_optimization(
    simulation_id: int,
    simulation_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # Start optimization in background
        asyncio.create_task(run_optimization(simulation_id, simulation_data, db))
        return {"message": "Optimization started"}
    except Exception as e:
        logger.error(f"Error starting optimization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting optimization: {str(e)}"
        )

# when user login then we have to fetch all the simulation of that user and we have to show that simulations
@app.get("/simulations", response_model=List[schemas.SimulationResponse])
async def get_simulations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # Get all simulations for the current user with their properties
        simulations = db.query(models.Simulation).filter(
            models.Simulation.user_id == current_user.id
        ).order_by(models.Simulation.generated_date.desc()).all()
        
        # For each simulation, get its properties and recommendations
        result = []
        for simulation in simulations:
            # Get coke properties
            coke_properties = db.query(models.SimulationProperties).filter(
                models.SimulationProperties.simulation_id == simulation.id,
                models.SimulationProperties.property_type == "coke"
            ).all()
            
            # Get blend properties
            blend_properties = db.query(models.SimulationProperties).filter(
                models.SimulationProperties.simulation_id == simulation.id,
                models.SimulationProperties.property_type == "blend"
            ).all()
            
            # Get recommendations
            recommendations = db.query(models.SimulationCoalRecommendations).filter(
                models.SimulationCoalRecommendations.simulation_id == simulation.id
            ).all()
            
            # Process recommendations to match the expected schema
            processed_recommendations = []
            for rec in recommendations:
                # For each coal in the recommendation, create a separate recommendation entry
                for coal_name, percentage in rec.coal_percentages.items():
                    if percentage > 0:  # Only include non-zero percentages
                        processed_rec = {
                            "id": rec.id,
                            "simulation_id": rec.simulation_id,
                            "coal_name": coal_name,
                            "percentage": percentage,
                            "predicted_ash": rec.predicted_ash,
                            "predicted_vm": rec.predicted_vm,
                            "predicted_fc": rec.predicted_fc,
                            "predicted_csn": rec.predicted_csn,
                            "predicted_cri": rec.predicted_cri,
                            "predicted_csr": rec.predicted_csr,
                            "predicted_ash_final": rec.predicted_ash_final,
                            "predicted_vm_final": rec.predicted_vm_final,
                            "total_cost": rec.total_cost,
                            "created_at": rec.created_at,
                            "updated_at": rec.updated_at
                        }
                        processed_recommendations.append(processed_rec)
            
            # Create a dictionary with all the required fields
            simulation_dict = {
                "id": simulation.id,
                "scenario_name": simulation.scenario_name,
                "scenario_description": simulation.scenario_description,
                "generated_date": simulation.generated_date,
                "status": simulation.status,
                "user_id": simulation.user_id,
                "coke_properties": coke_properties,
                "blend_properties": blend_properties,
                "recommendations": processed_recommendations
            }
            
            result.append(simulation_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching simulations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching simulations: {str(e)}"
        )
        

@app.get("/simulation/{simulation_id}", response_model=schemas.SimulationResponse)
async def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        # Get the simulation
        simulation = db.query(models.Simulation).filter(
            models.Simulation.id == simulation_id,
            models.Simulation.user_id == current_user.id
        ).first()
        
        if not simulation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Simulation with ID {simulation_id} not found"
            )
        
        # Get coke properties
        coke_properties = db.query(models.SimulationProperties).filter(
            models.SimulationProperties.simulation_id == simulation.id,
            models.SimulationProperties.property_type == "coke"
        ).all()
        
        # Get blend properties
        blend_properties = db.query(models.SimulationProperties).filter(
            models.SimulationProperties.simulation_id == simulation.id,
            models.SimulationProperties.property_type == "blend"
        ).all()
        
        # Get recommendations
        recommendations = db.query(models.SimulationCoalRecommendations).filter(
            models.SimulationCoalRecommendations.simulation_id == simulation.id
        ).all()
        
        # Process recommendations to match the expected schema and calculate emissions
        processed_recommendations = []
        for rec in recommendations:
            logger.info(f"\n=== Processing recommendation id={rec.id} for simulation id={simulation.id} ===")
            logger.info(f"Coal percentages: {rec.coal_percentages}")
            # Calculate emissions for this recommendation blend
            coal_properties = {}
            
            # Get coal properties for all coals in this recommendation
            for coal_name, percentage in rec.coal_percentages.items():
                if percentage > 0:  # Only get properties for coals with non-zero percentages
                    coal = db.query(models.CoalProperties).filter(
                        models.CoalProperties.coal_name == coal_name
                    ).first()
                    
                    if coal:
                        coal_properties[coal_name] = coal
                        logger.info(
                            f"Loaded properties for coal '{coal_name}' (percentage={percentage}%): "
                            f"FC={coal.FC}, Ash={coal.Ash}, VM={coal.VM}, S={coal.S}, N={coal.N}, CRI={coal.CRI}, CSR={coal.CSR}"
                        )
            
            # Calculate weighted averages for blend properties
            weighted_blend_properties = {
                "FC": 0.0,
                "Ash": 0.0,
                "VM": 0.0,
                "S": 0.0,
                "N": 0.0,
                "CRI": 0.0,
                "CSR": 0.0
            }
            
            # Calculate weighted averages
            for coal_name, percentage in rec.coal_percentages.items():
                if percentage > 0 and coal_name in coal_properties:
                    coal = coal_properties[coal_name]
                    weight = percentage / 100.0  # Convert percentage to decimal
                    
                    logger.info(
                        f"Contribution from '{coal_name}' (weight={weight:.4f}): "
                        f"FC={(coal.FC or 0.0) * weight:.4f}, Ash={(coal.Ash or 0.0) * weight:.4f}, "
                        f"VM={(coal.VM or 0.0) * weight:.4f}, S={(coal.S or 0.0) * weight:.4f}, "
                        f"N={(coal.N or 0.0) * weight:.4f}, CRI={(coal.CRI or 0.0) * weight:.4f}, CSR={(coal.CSR or 0.0) * weight:.4f}"
                    )
                    # Add weighted values 
                    weighted_blend_properties["FC"] += (coal.FC or 0.0) * weight
                    weighted_blend_properties["Ash"] += (coal.Ash or 0.0) * weight
                    weighted_blend_properties["VM"] += (coal.VM or 0.0) * weight
                    weighted_blend_properties["S"] += (coal.S or 0.0) * weight
                    weighted_blend_properties["N"] += (coal.N or 0.0) * weight
                    weighted_blend_properties["CRI"] += (coal.CRI or 0.0) * weight
                    weighted_blend_properties["CSR"] += (coal.CSR or 0.0) * weight

            logger.info(
                "Final weighted blend properties: "
                f"FC={weighted_blend_properties['FC']:.4f}, "
                f"Ash={weighted_blend_properties['Ash']:.4f}, "
                f"VM={weighted_blend_properties['VM']:.4f}, "
                f"S={weighted_blend_properties['S']:.4f}, "
                f"N={weighted_blend_properties['N']:.4f}, "
                f"CRI={weighted_blend_properties['CRI']:.4f}, "
                f"CSR={weighted_blend_properties['CSR']:.4f}"
            )
            
            # Calculate emissions for this blend
            logger.info(
                "Calculating emissions with inputs: "
                f"FC={weighted_blend_properties['FC']:.4f}, "
                f"Ash={weighted_blend_properties['Ash']:.4f}, "
                f"VM={weighted_blend_properties['VM']:.4f}, "
                f"S={weighted_blend_properties['S']:.4f}, "
                f"N={weighted_blend_properties['N']:.4f}, "
                f"CRI={weighted_blend_properties['CRI']:.4f}, "
                f"CSR={weighted_blend_properties['CSR']:.4f}"
            )
            emissions = calculate_emissions(
                fc=weighted_blend_properties["FC"],
                ash=weighted_blend_properties["Ash"],
                vm=weighted_blend_properties["VM"],
                s=weighted_blend_properties["S"],
                n=weighted_blend_properties["N"],
                cri=weighted_blend_properties["CRI"],
                csr=weighted_blend_properties["CSR"]
            )
            logger.info(
                "Emissions calculated: "
                f"CO2={emissions.get('CO2_Emissions', 0.0):.4f}, "
                f"CO={emissions.get('CO_Emissions', 0.0):.4f}, "
                f"SO2={emissions.get('SO2_Emissions', 0.0):.4f}, "
                f"NO={emissions.get('NO_Emissions', 0.0):.4f}, "
                f"NO2={emissions.get('NO2_Emissions', 0.0):.4f}, "
                f"PM_Index={emissions.get('PM_Index', 0.0):.6f}, "
                f"PM10={emissions.get('PM10_Emissions', 0.0):.6f}, "
                f"PM25={emissions.get('PM25_Emissions', 0.0):.6f}, "
                f"VOC_Index={emissions.get('VOC_Index', 0.0):.6f}, "
                f"VOC={emissions.get('VOC_Emissions', 0.0):.6f}, "
                f"PAH={emissions.get('PAH_Emissions', 0.0):.6f}"
            )
            
            # Update the recommendation record with calculated emissions
            rec.CO2_Emissions = emissions.get("CO2_Emissions", 0.0)
            rec.CO_Emissions = emissions.get("CO_Emissions", 0.0)
            rec.SO2_Emissions = emissions.get("SO2_Emissions", 0.0)
            rec.NO_Emissions = emissions.get("NO_Emissions", 0.0)
            rec.NO2_Emissions = emissions.get("NO2_Emissions", 0.0)
            rec.PM_index = emissions.get("PM_Index", 0.0)
            rec.PM10_Emissions = emissions.get("PM10_Emissions", 0.0)
            rec.PM25_Emissions = emissions.get("PM25_Emissions", 0.0)
            rec.VOC_index = emissions.get("VOC_Index", 0.0)
            rec.VOC_Emissions = emissions.get("VOC_Emissions", 0.0)
            rec.PAH_Emissions = emissions.get("PAH_Emissions", 0.0)
            
            # Commit the emission updates to database
            logger.info("Persisting calculated emissions back to the database for this recommendation")
            db.commit()
            
            # For each coal in the recommendation, create a separate recommendation entry
            for coal_name, percentage in rec.coal_percentages.items():
                if percentage > 0:  # Only include non-zero percentages
                    processed_rec = {
                        "id": rec.id,
                        "simulation_id": rec.simulation_id,
                        "coal_name": coal_name,
                        "percentage": percentage,
                        "predicted_ash": rec.predicted_ash,
                        "predicted_vm": rec.predicted_vm,
                        "predicted_fc": rec.predicted_fc,
                        "predicted_csn": rec.predicted_csn,
                        "predicted_cri": rec.predicted_cri,
                        "predicted_csr": rec.predicted_csr,
                        "predicted_ash_final": rec.predicted_ash_final,
                        "predicted_vm_final": rec.predicted_vm_final,
                        "total_cost": rec.total_cost,
                        "created_at": rec.created_at,
                        "updated_at": rec.updated_at,
                        # Add calculated emissions to the response
                        "CO2_Emissions": rec.CO2_Emissions,
                        "CO_Emissions": rec.CO_Emissions,
                        "SO2_Emissions": rec.SO2_Emissions,
                        "NO_Emissions": rec.NO_Emissions,
                        "NO2_Emissions": rec.NO2_Emissions,
                        "PM_index": rec.PM_index,
                        "PM10_Emissions": rec.PM10_Emissions,
                        "PM25_Emissions": rec.PM25_Emissions,
                        "VOC_index": rec.VOC_index,
                        "VOC_Emissions": rec.VOC_Emissions,
                        "PAH_Emissions": rec.PAH_Emissions
                    }
                    processed_recommendations.append(processed_rec)
        
        # Create response dictionary
        response_dict = {
            "id": simulation.id,
            "scenario_name": simulation.scenario_name,
            "scenario_description": simulation.scenario_description,
            "generated_date": simulation.generated_date,
            "status": simulation.status,
            "user_id": simulation.user_id,
            "coke_properties": coke_properties,
            "blend_properties": blend_properties,
            "recommendations": processed_recommendations
        }
        
        return response_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching simulation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while fetching simulation: {str(e)}"
        )

@app.get("/simulations/batch")
async def get_simulations_batch(
    simulation_ids: str,  # Comma-separated list of simulation IDs
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get status of multiple simulations in a single request
    """
    try:
        # Parse the comma-separated list of IDs
        ids = [int(id_str) for id_str in simulation_ids.split(",") if id_str.strip().isdigit()]
        
        if not ids:
            return []
            
        # Query all requested simulations that belong to the current user
        simulations = (
            db.query(models.Simulation)
            .filter(
                models.Simulation.id.in_(ids),
                models.Simulation.user_id == current_user.id
            )
            .all()
        )
        
        # Format the response
        result = []
        for sim in simulations:
            # Get the latest status update
            latest_update = (
                db.query(models.SimulationUpdate)
                .filter(models.SimulationUpdate.simulation_id == sim.id)
                .order_by(models.SimulationUpdate.timestamp.desc())
                .first()
            )
            
            # Prepare the simulation data
            sim_data = {
                "id": sim.id,
                "name": sim.scenario_name,
                "description": sim.scenario_description,
                "status": latest_update.status if latest_update else sim.status,
                "created_at": sim.generated_date.isoformat(),
                "updated_at": sim.generated_date.isoformat(),  # Using generated_date as updated_at for now
                "progress": latest_update.progress if latest_update else 0,
                "message": latest_update.message if latest_update else ""
            }
            
            # Add recommendations if available
            if sim.status == "completed" and sim.recommendations:
                sim_data["has_recommendations"] = True
                
            result.append(sim_data)
            
        return result
        
    except Exception as e:
        logger.error(f"Error in get_simulations_batch: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vendor/coal/upload", response_model=schemas.VendorCoalDataResponse)
async def upload_vendor_coal_pdf(
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    # Accept all possible coal properties as form fields
    coal_name: str = Form(None),
    vendor_name: str = Form(None),
    vendor_email: str = Form(None),
    IM: float = Form(None),
    Ash: float = Form(None),
    VM: float = Form(None),
    FC: float = Form(None),
    S: float = Form(None),
    P: float = Form(None),
    SiO2: float = Form(None),
    Al2O3: float = Form(None),
    Fe2O3: float = Form(None),
    CaO: float = Form(None),
    MgO: float = Form(None),
    Na2O: float = Form(None),
    K2O: float = Form(None),
    TiO2: float = Form(None),
    Mn3O4: float = Form(None),
    SO3: float = Form(None),
    P2O5: float = Form(None),
    CRI: float = Form(None),
    CSR: float = Form(None),
    N: float = Form(None),
):
    try:
        # Create data dictionary from form fields
        coal_data = {
            "coal_name": coal_name,
            "vendor_name": vendor_name,
            "vendor_email": vendor_email,
            "IM": IM,
            "Ash": Ash,
            "VM": VM,
            "FC": FC,
            "S": S,
            "P": P,
            "SiO2": SiO2,
            "Al2O3": Al2O3,
            "Fe2O3": Fe2O3,
            "CaO": CaO,
            "MgO": MgO,
            "Na2O": Na2O,
            "K2O": K2O,
            "TiO2": TiO2,
            "Mn3O4": Mn3O4,
            "SO3": SO3,
            "P2O5": P2O5,
            "CRI": CRI,
            "CSR": CSR,
            "N": N,
        }

        # If file is provided, parse it and update coal_data
        if file and file.filename.lower().endswith('.pdf'):
            try:
                # Read PDF content
                contents = await file.read()
                pdf_file = io.BytesIO(contents)
                reader = PyPDF2.PdfReader(pdf_file)
                
                # Extract text from PDF
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                
                # Parse the text and update coal_data with non-None values
                parsed_data = parse_coal_properties(text)
                for key, value in parsed_data.items():
                    if value is not None:
                        coal_data[key] = value
                        
                # If coal_name wasn't provided in form but was in filename
                if not coal_data.get("coal_name") and file.filename:
                    coal_data["coal_name"] = file.filename.rsplit('.', 1)[0].strip()
                    
            except Exception as e:
                logger.error(f"Error parsing PDF: {str(e)}")
                return {
                    "success": False,
                    "message": "Error parsing PDF file",
                    "error": str(e)
                }

        # Remove None values
        coal_data = {k: v for k, v in coal_data.items() if v is not None}

        # Validate required fields
        if not coal_data.get("coal_name"):
            return {
                "success": False,
                "message": "Coal name is required",
                "error": "Missing coal_name"
            }

        # Create database record
        db_coal = models.VendorCoalData(**coal_data)
        db.add(db_coal)
        db.commit()
        db.refresh(db_coal)

        return {
            "success": True,
            "message": "Coal data uploaded successfully and is pending approval",
            "data": db_coal
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error in upload_vendor_coal_pdf: {str(e)}")
        return {
            "success": False,
            "message": "Error processing coal data",
            "error": str(e)
        }


# --- PDF to HTML ---
def extract_html_from_pdf(pdf_path: Path) -> str:
    """Extract HTML-formatted text from all pages of a PDF (without <img> tags)."""
    html_content = ""
    with fitz.open(pdf_path) as doc:
        for page_num, page in enumerate(doc, start=1):
            page_html = page.get_text("html")
            soup = BeautifulSoup(page_html, "html.parser")
            for img_tag in soup.find_all("img"):
                img_tag.decompose()

            html_content += f"<!-- Page {page_num} -->\n{str(soup)}\n\n"
    return html_content


# --- Call Ollama for JSON ---
GEMINI_API_KEY =  "AIzaSyA2lkoh0Jl2RSWT-U5bR2toQhEmCi_0s9E"
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


# --- PDF to HTML ---
def extract_html_from_pdf(pdf_path: Path) -> str:
    """Extract HTML-formatted text from all pages of a PDF (without <img> tags)."""
    html_content = ""
    with fitz.open(pdf_path) as doc:
        for page_num, page in enumerate(doc, start=1):
            page_html = page.get_text("html")
            soup = BeautifulSoup(page_html, "html.parser")
            for img_tag in soup.find_all("img"):
                img_tag.decompose()
            html_content += f"<!-- Page {page_num} -->\n{str(soup)}\n\n"
    return html_content

import httpx
# --- Call Gemini REST API ---
def extract_json_with_gemini(text: str, json_schema: dict) -> str:
    system_prompt = f"""
        You are a precise data extraction assistant.
        Extract all values from the provided PDF text according to the following JSON schema:
        {json_schema}
        Fill missing values with null.
        Only output valid JSON, no extra text, and no markdown formatting.
        Strictly follow the schema.
    """

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt},
                    {"text": "Please read the following:\n" + text}
                ]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": 8192
        }
    }

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
    }

    with httpx.Client(timeout=120.0) as client:
        resp = client.post(GEMINI_ENDPOINT, headers=headers, json=payload)
        resp.raise_for_status()
        result = resp.json()

    # Response structure → get model output
    raw_output = result["candidates"][0]["content"]["parts"][0]["text"]

    # remove <think>...</think> blocks if present
    cleaned_output = re.sub(r"<think>.*?</think>", "", raw_output, flags=re.DOTALL)
    cleaned_output = re.sub(r"```json\s*", "", cleaned_output)
    cleaned_output = re.sub(r"```", "", cleaned_output)

    return cleaned_output.strip()


# --- API Endpoint ---
@app.post("/api/coal/upload", response_model=schemas.CoalPDFUploadResponse)
async def upload_coal_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not file.filename.lower().endswith('.pdf'):
        return {
            "success": False,
            "message": "Invalid file type",
            "error": "Only PDF files are allowed"
        }

    # Save temporarily
    temp_pdf = Path("temp") / file.filename
    temp_pdf.parent.mkdir(exist_ok=True)
    with open(temp_pdf, "wb") as f:
        f.write(await file.read())

    # Extract text and JSON
    raw_text = extract_html_from_pdf(temp_pdf)
    json_str = extract_json_with_gemini(raw_text, json_schema)

    # Validate & save JSON only
    output_folder = Path("output")
    output_folder.mkdir(exist_ok=True)
    json_output_path = output_folder / (Path(file.filename).stem + ".json")

    try:
        parsed = json.loads(json_str)
        with open(json_output_path, "w") as f:
            json.dump(parsed, f, indent=2)
        return {
            "success": True,
            "message": "Coal PDF processed successfully",
            "data": parsed
        }
    except json.JSONDecodeError:
        return {
            "success": False,
            "message": "Failed to parse JSON",
            "error": json_str
        }
@app.get("/api/vendor/coal", response_model=List[schemas.VendorCoalData])
def get_vendor_coal_data(
    approved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get vendor coal data (admin only)
    """
    # TODO: Add admin check
    query = db.query(models.VendorCoalData)
    if approved is not None:
        query = query.filter(models.VendorCoalData.is_approved == approved)
    return query.offset(skip).limit(limit).all()

@app.patch("/api/vendor/coal/{coal_id}", response_model=schemas.VendorCoalDataResponse)
def update_vendor_coal_data(
    coal_id: int,
    coal_data: schemas.VendorCoalDataUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update vendor coal data (admin only)
    """
    # TODO: Add admin check
    db_coal = db.query(models.VendorCoalData).filter(models.VendorCoalData.id == coal_id).first()
    if not db_coal:
        raise HTTPException(status_code=404, detail="Vendor coal data not found")
    
    update_data = coal_data.dict(exclude_unset=True)
    if 'is_approved' in update_data and update_data['is_approved']:
        update_data['approved_by'] = current_user.id
        update_data['approved_date'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_coal, field, value)
    
    db.commit()
    db.refresh(db_coal)
    
    return {
        "success": True,
        "message": "Vendor coal data updated successfully",
        "data": db_coal
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="localhost", port=8000, log_level="info")