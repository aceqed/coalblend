from sqlalchemy import Boolean, Column, Integer, String, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(255))
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add relationship
    simulations = relationship("Simulation", back_populates="user")

class CoalProperties(Base):
    __tablename__ = "coal_properties_clean"

    coal_name = Column(String(100), primary_key=True, index=True)
    IM = Column(Float)
    Ash = Column(Float)
    VM = Column(Float)
    FC = Column(Float)
    S = Column(Float)
    P = Column(Float)
    SiO2 = Column(Float)
    Al2O3 = Column(Float)
    Fe2O3 = Column(Float)
    CaO = Column(Float)
    MgO = Column(Float)
    Na2O = Column(Float)
    K2O = Column(Float)
    TiO2 = Column(Float)
    Mn3O4 = Column(Float)
    SO3 = Column(Float)
    P2O5 = Column(Float)
    BaO = Column(Float)
    SrO = Column(Float)
    ZnO = Column(Float)
    CRI = Column(Float)
    CSR = Column(Float)
    N = Column(Float)
    HGI = Column(Float)
    Rank = Column(String(50))
    Vitrinite = Column(Float)
    Liptinite = Column(Float)
    Semi_Fusinite = Column(Float)
    CSN_FSI = Column(Float)
    Initial_Softening_Temp = Column(Float)
    MBI = Column(Float)
    CBI = Column(Float)
    Log_Max_Fluidity = Column(Float)
    coal_category = Column(String(50))
    C = Column(Float)
    H = Column(Float)
    O = Column(Float)
    ss = Column(Float)
    # Vitrinite reflectance values (V7 to V19)
    V7 = Column(Float)
    V8 = Column(Float)
    V9 = Column(Float)
    V10 = Column(Float)
    V11 = Column(Float)
    V12 = Column(Float)
    V13 = Column(Float)
    V14 = Column(Float)
    V15 = Column(Float)
    V16 = Column(Float)
    V17 = Column(Float)
    V18 = Column(Float)
    V19 = Column(Float)
    # Additional properties for CBI and Log Max Fluidity calculations
    Inertinite = Column(Float)
    Minerals = Column(Float)
    MaxFluidity = Column(Float)

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String(255), nullable=False)
    scenario_description = Column(Text)
    generated_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    user = relationship("User", back_populates="simulations")
    properties = relationship("SimulationProperties", back_populates="simulation", cascade="all, delete-orphan")
    recommendations = relationship("BlendRecommendation", back_populates="simulation", cascade="all, delete-orphan")
    coal_recommendations = relationship("SimulationCoalRecommendations", back_populates="simulation", cascade="all, delete-orphan")
    updates = relationship("SimulationUpdate", backref="simulation", cascade="all, delete-orphan")

class SimulationProperties(Base):
    __tablename__ = "simulation_properties"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))
    property_type = Column(String(50))  # 'coke' or 'blend'
    property_name = Column(String(50))
    min_value = Column(Float)
    max_value = Column(Float)

    # Relationship
    simulation = relationship("Simulation", back_populates="properties")

class BlendRecommendation(Base):
    __tablename__ = "blend_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))
    coal_name = Column(String(100))
    percentage = Column(Float)
    predicted_ash = Column(Float)
    predicted_vm = Column(Float)
    predicted_fc = Column(Float)
    predicted_csn = Column(Float)
    predicted_cri = Column(Float)
    predicted_csr = Column(Float)
    predicted_ash_final = Column(Float)
    predicted_vm_final = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    simulation = relationship("Simulation", back_populates="recommendations")

class SimulationCoalRecommendations(Base):
    __tablename__ = "simulationCoalRecommendations"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))
    
    # Store coal percentages in a JSON column
    coal_percentages = Column(JSON, default={
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
    })

    # Predicted values
    predicted_ash = Column(Float)
    predicted_vm = Column(Float)
    predicted_fc = Column(Float)
    predicted_csn = Column(Float)
    predicted_cri = Column(Float)
    predicted_csr = Column(Float)
    predicted_ash_final = Column(Float)
    predicted_vm_final = Column(Float)
    CO2_Emissions = Column(Float)
    CO_Emissions = Column(Float)
    SO2_Emissions = Column(Float)
    NO_Emissions = Column(Float)
    NO2_Emissions = Column(Float)
    PM_index = Column(Float)
    PM10_Emissions = Column(Float)
    PM25_Emissions = Column(Float)
    VOC_index = Column(Float)
    VOC_Emissions = Column(Float)
    PAH_Emissions = Column(Float)
   
    total_cost = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    simulation = relationship("Simulation", back_populates="coal_recommendations") 

class SimulationUpdate(Base):
    __tablename__ = "simulation_updates"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"))
    status = Column(String(50))  # running, completed, failed
    progress = Column(Float, default=0.0)  # 0 to 100
    message = Column(Text)  # Optional status message
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class VendorCoalData(Base):
    """Stores coal data uploaded by vendors"""
    __tablename__ = "vendor_coal_data"
    
    id = Column(Integer, primary_key=True, index=True)
    coal_name = Column(String, index=True, nullable=False)
    IM = Column(Float)
    Ash = Column(Float)
    VM = Column(Float)
    FC = Column(Float)
    S = Column(Float)
    P = Column(Float)
    SiO2 = Column(Float)
    Al2O3 = Column(Float)
    Fe2O3 = Column(Float)
    CaO = Column(Float)
    MgO = Column(Float)
    Na2O = Column(Float)
    K2O = Column(Float)
    TiO2 = Column(Float)
    Mn3O4 = Column(Float)
    SO3 = Column(Float)
    P2O5 = Column(Float)
    BaO = Column(Float)
    SrO = Column(Float)
    ZnO = Column(Float)
    CRI = Column(Float)
    CSR = Column(Float)
    N = Column(Float)
    # Vitrinite reflectance values (V7 to V19)
    V7 = Column(Float)
    V8 = Column(Float)
    V9 = Column(Float)
    V10 = Column(Float)
    V11 = Column(Float)
    V12 = Column(Float)
    V13 = Column(Float)
    V14 = Column(Float)
    V15 = Column(Float)
    V16 = Column(Float)
    V17 = Column(Float)
    V18 = Column(Float)
    V19 = Column(Float)
    # Additional properties for CBI and Log Max Fluidity calculations
    Inertinite = Column(Float)
    Minerals = Column(Float)
    Max_Fluidity_ddpm = Column(Float)
    vendor_name = Column(String, nullable=True)
    vendor_email = Column(String, nullable=True)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    is_approved = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)