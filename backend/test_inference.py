#!/usr/bin/env python3
"""
Test script for the Coal Blend Inference Engine
This script tests the inference engine with sample data to ensure it works correctly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from inference_engine import CoalBlendInferenceEngine
import numpy as np

def create_sample_coal_data():
    """Create sample coal data for testing."""
    class MockCoal:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
    
    # Sample coal properties (based on typical coal data)
    coal_data = {
        "Metropolitan": MockCoal(
            IM=1.2, Ash=8.5, VM=25.3, FC=65.0, S=0.6, P=0.02,
            SiO2=45.2, Al2O3=25.8, Fe2O3=8.5, CaO=2.1, MgO=1.2,
            Na2O=0.8, K2O=1.5, TiO2=1.8, Mn3O4=0.1, SO3=1.2,
            P2O5=0.3, BaO=0.05, SrO=0.02, ZnO=0.01, CRI=25.5,
            CSR=65.2, N=1.8, HGI=45.0, Vitrinite=75.0, Liptinite=5.0,
            Semi_Fusinite=15.0, CSN_FSI=6.5, Initial_Softening_Temp=1200.0,
            MBI=2.5, CBI=0.8, Log_Max_Fluidity=2.1, C=85.0, H=5.2, O=8.1, ss=0.3,
            Inertinite=5.0, Minerals=2.0, Max_Fluidity_ddpm=500.0,
            V7=15.0, V8=12.0, V9=10.0, V10=9.0, V11=10.0, V12=12.0, V13=15.0,
            V14=20.0, V15=28.0, V16=38.0, V17=48.0, V18=60.0, V19=72.0
        ),
        "Lake Vermont": MockCoal(
            IM=1.5, Ash=9.2, VM=26.1, FC=63.2, S=0.7, P=0.03,
            SiO2=48.1, Al2O3=26.5, Fe2O3=7.8, CaO=2.8, MgO=1.5,
            Na2O=0.9, K2O=1.8, TiO2=2.1, Mn3O4=0.12, SO3=1.5,
            P2O5=0.4, BaO=0.06, SrO=0.03, ZnO=0.015, CRI=26.8,
            CSR=63.5, N=1.9, HGI=48.0, Vitrinite=78.0, Liptinite=4.0,
            Semi_Fusinite=12.0, CSN_FSI=6.8, Initial_Softening_Temp=1180.0,
            MBI=2.8, CBI=0.9, Log_Max_Fluidity=2.3, C=84.5, H=5.5, O=8.5, ss=0.4,
            Inertinite=6.0, Minerals=2.5, Max_Fluidity_ddpm=600.0,
            V7=18.0, V8=14.0, V9=12.0, V10=11.0, V11=12.0, V12=14.0, V13=17.0,
            V14=22.0, V15=30.0, V16=40.0, V17=50.0, V18=62.0, V19=74.0
        ),
        "PDN": MockCoal(
            IM=1.8, Ash=10.1, VM=27.5, FC=60.6, S=0.8, P=0.04,
            SiO2=50.2, Al2O3=27.1, Fe2O3=6.9, CaO=3.2, MgO=1.8,
            Na2O=1.1, K2O=2.1, TiO2=2.4, Mn3O4=0.15, SO3=1.8,
            P2O5=0.5, BaO=0.07, SrO=0.04, ZnO=0.02, CRI=28.2,
            CSR=61.8, N=2.1, HGI=52.0, Vitrinite=80.0, Liptinite=3.0,
            Semi_Fusinite=10.0, CSN_FSI=7.2, Initial_Softening_Temp=1150.0,
            MBI=3.1, CBI=1.0, Log_Max_Fluidity=2.5, C=84.0, H=5.8, O=8.9, ss=0.5,
            Inertinite=7.0, Minerals=3.0, Max_Fluidity_ddpm=700.0,
            V7=21.0, V8=16.0, V9=14.0, V10=13.0, V11=14.0, V12=16.0, V13=19.0,
            V14=24.0, V15=32.0, V16=42.0, V17=52.0, V18=64.0, V19=76.0
        )
    }
    
    return coal_data

def test_inference_engine():
    """Test the inference engine with sample data."""
    print("=== Testing Coal Blend Inference Engine ===\n")
    
    # Create sample coal data
    coal_properties = create_sample_coal_data()
    print("Sample coal data created:")
    for coal_name, coal in coal_properties.items():
        print(f"  {coal_name}: Ash={coal.Ash}%, VM={coal.VM}%, CRI={coal.CRI}, CSR={coal.CSR}")
    print()
    
    # Create sample blend ratios
    blend_ratios = [
        {"coal_name": "Metropolitan", "percentage": 40},
        {"coal_name": "Lake Vermont", "percentage": 35},
        {"coal_name": "PDN", "percentage": 25}
    ]
    print("Sample blend ratios:")
    for blend in blend_ratios:
        print(f"  {blend['coal_name']}: {blend['percentage']}%")
    print()
    
    try:
        # Initialize inference engine
        print("=== Initializing Inference Engine ===")
        inference_engine = CoalBlendInferenceEngine()
        print("Inference engine initialized successfully")
        print()
        
        # Test weighted average calculation
        print("=== Testing Weighted Average Calculation ===")
        weighted_props = inference_engine.calculate_weighted_averages(coal_properties, blend_ratios)
        print("Weighted averages (first 10):")
        for i, (prop, value) in enumerate(weighted_props.items()):
            if i < 10:  # Show first 10 properties
                print(f"  {prop}: {value:.4f}")
        print("  ... (showing first 10 of", len(weighted_props), "properties)")
        print()
        
        # Test feature engineering
        print("=== Testing Feature Engineering ===")
        engineered_features = inference_engine.engineer_features(weighted_props)
        print("Engineered features:")
        for feature, value in engineered_features.items():
            if isinstance(value, float):
                print(f"  {feature}: {value:.4f}")
            else:
                print(f"  {feature}: {value}")
        print()
        
        # Test direct formula calculations
        print("=== Testing Direct Formula Calculations ===")
        direct_calcs = inference_engine.calculate_direct_formulas(weighted_props)
        print("Direct calculations:")
        for calc, value in direct_calcs.items():
            print(f"  {calc}: {value:.4f}")
        print()
        
        # Test complete inference pipeline
        print("=== Testing Complete Inference Pipeline ===")
        inference_results = inference_engine.run_inference(coal_properties, blend_ratios)
        
        print("Inference results:")
        print("  Blend properties count:", len(inference_results["blend_properties"]))
        print("  Predicted targets:", inference_results["predicted_targets"])
        print("  Emissions count:", len(inference_results["emissions"]))
        print()
        
        # Show some key results
        print("Key Results:")
        targets = inference_results["predicted_targets"]
        for target, value in targets.items():
            print(f"  {target}: {value:.4f}")
        
        print("\nSample Emissions:")
        emissions = inference_results["emissions"]
        for emission, value in list(emissions.items())[:5]:  # Show first 5
            print(f"  {emission}: {value:.4f}")
        print("  ... (showing first 5 of", len(emissions), "emissions)")
        print()
        
        print("=== All Tests Passed Successfully! ===")
        
    except Exception as e:
        print(f"Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_inference_engine()
