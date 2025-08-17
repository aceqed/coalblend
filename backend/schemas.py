from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class CoalPropertiesBase(BaseModel):
    coal_name: str
    IM: float
    Ash: float
    VM: float
    FC: float
    S: float
    P: float
    SiO2: float
    Al2O3: float
    Fe2O3: float
    CaO: float
    MgO: float
    Na2O: float
    K2O: float
    TiO2: float
    Mn3O4: float
    SO3: float
    P2O5: float
    BaO: float
    SrO: float
    ZnO: float
    CRI: float
    CSR: float
    N: float
    HGI: float
    Rank: str              # Rank is usually categorical (string like "High", "Medium")
    Vitrinite: float   # renamed `Vitrinite %` → valid Python identifier
    Liptinite: float
    Semi_Fusinite: float
    CSN_FSI: float
    Initial_Softening_Temp: float
    MBI: float
    CBI: float
    Log_Max_Fluidity: float
    coal_category: str      # categorical column
    C: float
    H: float
    O: float
    ss: float
    # Vitrinite reflectance values (V7 to V19)
    V7: Optional[float] = None
    V8: Optional[float] = None
    V9: Optional[float] = None
    V10: Optional[float] = None
    V11: Optional[float] = None
    V12: Optional[float] = None
    V13: Optional[float] = None
    V14: Optional[float] = None
    V15: Optional[float] = None
    V16: Optional[float] = None
    V17: Optional[float] = None
    V18: Optional[float] = None
    V19: Optional[float] = None
    # Additional properties for CBI and Log Max Fluidity calculations
    Inertinite: Optional[float] = None
    Minerals: Optional[float] = None
    MaxFluidity: Optional[float] = None


class CoalPropertiesCreate(CoalPropertiesBase):
    pass

class CoalProperties(CoalPropertiesBase):
    id: int

    class Config:
        from_attributes = True

class CoalBlendInput(BaseModel):
    coal_name: str
    percentage: float

class PredictionInput(BaseModel):
    blends: List[CoalBlendInput]

class PredictionOutput(BaseModel):
    blend_properties: Dict[str, float]
    predicted_coal_properties: Dict[str, float]
    predicted_coke_properties: Dict[str, float]

class SimulationPropertiesBase(BaseModel):
    property_type: str  # 'coke' or 'blend'
    property_name: str
    min_value: float
    max_value: float

class SimulationPropertiesCreate(SimulationPropertiesBase):
    pass

class SimulationProperties(SimulationPropertiesBase):
    id: int
    simulation_id: int

    class Config:
        from_attributes = True

class SimulationBase(BaseModel):
    scenario_name: str
    scenario_description: Optional[str] = None

class SimulationCreate(SimulationBase):
    coke_properties: List[SimulationPropertiesCreate]
    blend_properties: List[SimulationPropertiesCreate]

class Simulation(SimulationBase):
    id: int
    generated_date: datetime
    status: str
    user_id: int
    properties: List[SimulationProperties]

    class Config:
        from_attributes = True

class BlendRecommendationBase(BaseModel):
    coal_name: str
    percentage: float
    predicted_ash: float
    predicted_vm: float
    predicted_fc: float
    predicted_csn: float
    predicted_cri: float
    predicted_csr: float
    predicted_ash_final: float
    predicted_vm_final: float
    # Emission properties
    CO2_Emissions: Optional[float] = None
    CO_Emissions: Optional[float] = None
    SO2_Emissions: Optional[float] = None
    NO_Emissions: Optional[float] = None
    NO2_Emissions: Optional[float] = None
    PM_index: Optional[float] = None
    PM10_Emissions: Optional[float] = None
    PM25_Emissions: Optional[float] = None
    VOC_index: Optional[float] = None
    VOC_Emissions: Optional[float] = None
    PAH_Emissions: Optional[float] = None

class BlendRecommendationCreate(BlendRecommendationBase):
    pass

class BlendRecommendation(BlendRecommendationBase):
    id: int
    simulation_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SimulationResponse(BaseModel):
    id: int
    scenario_name: str
    scenario_description: Optional[str]
    generated_date: datetime
    status: str
    coke_properties: List[SimulationProperties]
    blend_properties: List[SimulationProperties]
    recommendations: List[BlendRecommendation]

    class Config:
        from_attributes = True 

class VendorCoalDataBase(BaseModel):
    """Base schema for vendor coal data"""
    coal_name: str
    IM: Optional[float] = None
    Ash: Optional[float] = None
    VM: Optional[float] = None
    FC: Optional[float] = None
    S: Optional[float] = None
    P: Optional[float] = None
    SiO2: Optional[float] = None
    Al2O3: Optional[float] = None
    Fe2O3: Optional[float] = None
    CaO: Optional[float] = None
    MgO: Optional[float] = None
    Na2O: Optional[float] = None
    K2O: Optional[float] = None
    TiO2: Optional[float] = None
    Mn3O4: Optional[float] = None
    SO3: Optional[float] = None
    P2O5: Optional[float] = None
    BaO: Optional[float] = None
    SrO: Optional[float] = None
    ZnO: Optional[float] = None
    CRI: Optional[float] = None
    CSR: Optional[float] = None
    N: Optional[float] = None
    # Vitrinite reflectance values (V7 to V19)
    V7: Optional[float] = None
    V8: Optional[float] = None
    V9: Optional[float] = None
    V10: Optional[float] = None
    V11: Optional[float] = None
    V12: Optional[float] = None
    V13: Optional[float] = None
    V14: Optional[float] = None
    V15: Optional[float] = None
    V16: Optional[float] = None
    V17: Optional[float] = None
    V18: Optional[float] = None
    V19: Optional[float] = None
    # Additional properties for CBI and Log Max Fluidity calculations
    Inertinite: Optional[float] = None
    Minerals: Optional[float] = None
    Max_Fluidity_ddpm: Optional[float] = None
    vendor_name: Optional[str] = None
    vendor_email: Optional[EmailStr] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class VendorCoalDataCreate(VendorCoalDataBase):
    """Schema for creating new vendor coal data"""
    pass

class VendorCoalDataUpdate(BaseModel):
    """Schema for updating vendor coal data (admin only)"""
    is_approved: Optional[bool] = None
    approved_by: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class VendorCoalData(VendorCoalDataBase):
    """Schema for returning vendor coal data"""
    id: int
    upload_date: datetime
    is_approved: bool
    approved_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class VendorCoalDataResponse(BaseModel):
    """Response model for vendor coal data operations"""
    success: bool
    message: str
    data: Optional[VendorCoalData] = None
    error: Optional[str] = None

class CoalPDFUploadResponse(BaseModel):
    """Response model for coal PDF upload operations"""
    success: bool
    message: str
    coal_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True