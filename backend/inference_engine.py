# inference_engine.py
import os
import json
import logging
from typing import Dict, List, Optional, Any

import numpy as np
import pandas as pd
import joblib

logger = logging.getLogger(__name__)

# =========================
# Final feature keys (exact names you requested)
# =========================
FINAL_FEATURE_ORDER = [
    "HCC", "SHCC", "HFCC", "PCI", "WC",
    "CRI", "CSR", "ASH", "VM",
    "weighted_Ash", "weighted_V.M.", "weighted_F.C", "weighted_Total Sulphur",
    "weighted_Phosphorus", "weighted_HGI (ASTM)", "weighted_Rank",
    "weighted_Vitrinite %", "weighted_Liptinite", "weighted_Semi-Fusinite",
    "weighted_CSN/FSI", "weighted_Initial Softening Temp.",
    "weighted_CRI", "weighted_CSR", "weighted_C", "weighted_H",
    "weighted_N", "weighted_O", "weighted_S",
    "weighted_BI", "weighted_MBI", "weighted_CBI", "weighted_Log_Max_Fluidity",
    "CRI_direct", "CSR_from_CRI", "CSR_direct",
]

# Present in final_features but must be DROPPED before scaling
TARGET_COLUMNS = ["CRI", "CSR", "ASH", "VM","weighted_CRI","weighted_Ash","weighted_CSR"]

# Category flags
CATEGORY_FLAGS = ["HCC", "SHCC", "HFCC", "PCI", "WC"]


class CoalBlendInferenceEngine:
    """
    Flow:
      1) Weighted averages from DB schema (object attributes).
      2) Engineer BI/MBI/CBI/VRs/Log(MaxFluidity).
      3) Compute CRI_direct / CSR_from_CRI / CSR_direct.
      4) Build FINAL feature dict (exact keys above).
      5) Drop CRI/CSR/ASH/VM and apply COLUMN-WISE scaler from scaler_colwise.pkl.
      6) For each target (CRI/CSR/VM/ASH):
           scaled_features --(select columns from {TARGET}_features.pkl)--> X
           X --({TARGET}_model.pkl.predict)--> prediction
      7) Emissions (from predictions with weighted fallbacks).
    """

    def __init__(self, models_dir: Optional[str] = None):
        # All artifacts live here
        self.models_dir = models_dir or os.path.join(os.path.dirname(__file__), "Models")

        # Column-wise scaler and its training order
        self.colwise_scaler = None
        self.colwise_feature_names: Optional[List[str]] = None

        # Per-target assets
        self.target_models: Dict[str, Any] = {}
        self.target_features: Dict[str, List[str]] = {}
        self.target_scalers: Dict[str, Any] = {}  # optional; safe to stay empty

        logger.info(f"Initializing inference engine with models directory: {self.models_dir}")
        self.load_all_models()

    # -------------------------
    # Model / Scaler loading
    # -------------------------
    def load_all_models(self) -> None:
        """
        Load artifacts:
          - scaler_colwise.pkl  ({"scaler": est, "feature_names": [...] } or bare est)
          - {TARGET}_features.pkl (list[str] feature names from the SCALED dict)
          - {TARGET}_model.pkl    (trained estimator with .predict)
          - (optional) {TARGET}_scaler.pkl
        """
        try:
            # 1) Column-wise scaler
            scaler_path = os.path.join(self.models_dir, "scaler_colwise.pkl")
            if os.path.exists(scaler_path):
                with open(scaler_path, "rb") as f:
                    blob = joblib.load(f)
                if isinstance(blob, dict):
                    self.colwise_scaler = blob.get("scaler")
                    self.colwise_feature_names = blob.get("feature_names")
                else:
                    self.colwise_scaler = blob
                    self.colwise_feature_names = None
                logger.info(f"Column-wise scaler loaded from {scaler_path}")
            else:
                logger.warning(
                    "scaler_colwise.pkl not found in %s. Column-wise normalization will be skipped.",
                    self.models_dir,
                )

            # 2) Per-target feature lists + models (+ optional scalers)
            for target in ["CRI", "CSR", "VM", "ASH"]:
                # features list
                fpath = os.path.join(self.models_dir, f"{target}_features.pkl")
                if os.path.exists(fpath):
                    with open(fpath, "rb") as f:
                        self.target_features[target] = joblib.load(f)
                    logger.info(
                        "Loaded %s_features.pkl (%d columns).",
                        target, len(self.target_features[target])
                    )
                else:
                    logger.warning("%s_features.pkl missing in %s", target, self.models_dir)

                # (optional) per-target scaler
                spath = os.path.join(self.models_dir, f"{target}_scaler.pkl")
                if os.path.exists(spath):
                    with open(spath, "rb") as f:
                        sblob = joblib.load(f)
                    self.target_scalers[target] = sblob["scaler"] if isinstance(sblob, dict) else sblob
                    logger.info("Loaded %s_scaler.pkl", target)

                # model
                mpath = os.path.join(self.models_dir, f"{target}_model.pkl")
                if os.path.exists(mpath):
                    with open(mpath, "rb") as f:
                        self.target_models[target] = joblib.load(f)
                    logger.info("Loaded %s_model.pkl", target)
                else:
                    logger.warning("%s_model.pkl missing in %s", target, self.models_dir)

        except Exception as e:
            logger.exception("Error loading models/scalers")
            raise

    # -------------------------
    # Pretty printer
    # -------------------------
    def _print_section(self, title: str, data: Any) -> None:
        """Pretty-print to logger and stdout."""
        def _default(obj):
            if isinstance(obj, (np.floating, np.integer)):
                return obj.item()
            return str(obj)
        try:
            pretty = json.dumps(data, indent=2, sort_keys=True, default=_default)
        except Exception:
            pretty = str(data)
        logger.info("\n=== %s ===\n%s", title, pretty)
        print(f"\n=== {title} ===\n{pretty}")

    # -------------------------
    # Weighted averages
    # -------------------------
    def calculate_weighted_averages(self, coal_properties: Dict[str, Any], blend_ratios: List[Dict]) -> Dict[str, float]:
        """
        Weighted averages for numeric properties and category composition.
        Expects each coal object to expose attributes named by your DB schema.
        """
        logger.info("Starting weighted average calculations...")

        props = [
            "IM", "Ash", "VM", "FC", "S", "P", "SiO2", "Al2O3", "Fe2O3", "CaO", "MgO",
            "Na2O", "K2O", "TiO2", "Mn3O4", "SO3", "P2O5", "BaO", "SrO", "ZnO",
            "CRI", "CSR", "N", "HGI", "Vitrinite", "Liptinite", "Semi_Fusinite",
            "CSN_FSI", "Initial_Softening_Temp", "MBI", "CBI", "Log_Max_Fluidity",
            "C", "H", "O", "ss",
            "V7", "V8", "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19",
            "Inertinite", "Minerals", "MaxFluidity",
        ]

        weighted: Dict[str, float] = {f"weighted_{p}": 0.0 for p in props}
        cats = {k: 0.0 for k in CATEGORY_FLAGS}

        # Pass 1: category composition
        for b in blend_ratios:
            name = b.get("coal_name")
            pct = float(b.get("percentage", 0.0))
            coal = coal_properties.get(name)
            if not coal:
                continue
            category = getattr(coal, "category", None)
            if category is None:
                category = getattr(coal, "coal_category", "")
            category = str(category).upper()
            if category in cats:
                cats[category] += pct

        total_pct = sum(cats.values())
        for k in cats:
            weighted[k] = (cats[k] / total_pct) * 100.0 if total_pct > 0 else 0.0

        # Pass 2: numeric blending
        for b in blend_ratios:
            name = b.get("coal_name")
            pct = float(b.get("percentage", 0.0))
            w = pct / 100.0
            coal = coal_properties.get(name)
            if not coal:
                continue

            for p in props:
                if not hasattr(coal, p):
                    continue
                val = getattr(coal, p)
                if val is None:
                    continue
                try:
                    v = float(val)
                except Exception:
                    continue
                weighted[f"weighted_{p}"] += v * w

        # Also expose raw targets at blend-level (as requested)
        weighted["CRI"] = weighted.get("weighted_CRI", 0.0)
        weighted["CSR"] = weighted.get("weighted_CSR", 0.0)
        weighted["ASH"] = weighted.get("weighted_Ash", 0.0)
        weighted["VM"]  = weighted.get("weighted_VM", 0.0)

        logger.info("Weighted average calculations completed.")
        self._print_section("Weighted Averages", weighted)
        return weighted

    # -------------------------
    # Feature engineering
    # -------------------------
    def engineer_features(self, w: Dict[str, float]) -> Dict[str, float]:
        logger.info("Starting feature engineering...")

        # BI
        num = w.get("weighted_Fe2O3", 0.0) + w.get("weighted_CaO", 0.0) + w.get("weighted_MgO", 0.0) \
              + w.get("weighted_Na2O", 0.0) + w.get("weighted_K2O", 0.0)
        den = w.get("weighted_SiO2", 0.0) + w.get("weighted_Al2O3", 0.0) + w.get("weighted_TiO2", 0.0)
        BI = (num / den) if den != 0 else 0.0

        # MBI
        w_ash = w.get("weighted_Ash", 0.0)
        w_vm = w.get("weighted_VM", 0.0)
        MBI = ((w_ash * 100.0) / (100.0 - w_vm)) * BI if w_vm != 100.0 else 0.0

        # VR ratios
        divisors = {"V7":3, "V8":2.7, "V9":2.5, "V10":2.4, "V11":2.5,
                    "V12":3, "V13":3.7, "V14":5, "V15":7, "V16":9.6,
                    "V17":12, "V18":15, "V19":18}
        VRs = {}
        for vcol, d in divisors.items():
            val = w.get(f"weighted_{vcol}", 0.0)
            VRs[f"weighted_VR{vcol[1:]}"] = (val / d) if d else 0.0
        sum_vr = sum(VRs.values())

        # CBI (only for coking categories and valid denom)
        any_hcc = (w.get("HCC", 0.0) + w.get("HFCC", 0.0) + w.get("SHCC", 0.0)) > 0.0
        inert = w.get("weighted_Inertinite", None)
        mins  = w.get("weighted_Minerals", None)
        if any_hcc and sum_vr != 0 and inert is not None and mins is not None:
            CBI = (inert + mins) / sum_vr
        else:
            CBI = 0.0

        # weighted_Log_Max_Fluidity
        lmf = w.get("weighted_Log_Max_Fluidity", None)
        if lmf is None or lmf == 0.0:
            mf = w.get("weighted_MaxFluidity", 0.0)
            lmf = np.log(mf) if mf and mf > 0 else 0.0

        engineered = {
            "weighted_BI": BI,
            "weighted_MBI": MBI,
            "weighted_CBI": CBI,
            "weighted_Log_Max_Fluidity": lmf,
        }
        engineered.update(VRs)

        logger.info("Feature engineering completed.")
        return engineered

    # -------------------------
    # Direct formula proxies
    # -------------------------
    def calculate_direct_formulas(self, w: Dict[str, float]) -> Dict[str, float]:
        logger.info("Calculating CRI/CSR direct formulas...")
        VM = w.get("weighted_VM", 0.0)
        LMF = w.get("weighted_Log_Max_Fluidity", 0.0)
        CRI_direct = -16.48 + 8.16 * VM - 21.68 * LMF
        CSR_from_CRI = 94.19 - 1.15 * CRI_direct
        CSR_direct = 95.76 - 2.50 * VM + 11.00 * LMF
        return {"CRI_direct": CRI_direct, "CSR_from_CRI": CSR_from_CRI, "CSR_direct": CSR_direct}

    # -------------------------
    # Build final features (exact keys)
    # -------------------------
    def build_final_features(self,
                             weighted: Dict[str, float],
                             engineered: Dict[str, float],
                             direct: Dict[str, float]) -> Dict[str, float]:
        logger.info("Building final feature dictionary (exact names)...")
        g = weighted.get

        final_features = {
            # categories
            "HCC": g("HCC", 0.0),
            "SHCC": g("SHCC", 0.0),
            "HFCC": g("HFCC", 0.0),
            "PCI": g("PCI", 0.0),
            "WC":  g("WC", 0.0),

            # raw targets (kept, but DROPPED before scaling)
            "CRI": g("CRI", g("weighted_CRI", 0.0)),
            "CSR": g("CSR", g("weighted_CSR", 0.0)),
            "ASH": g("ASH", g("weighted_Ash", 0.0)),
            "VM":  g("VM",  g("weighted_VM", 0.0)),

            # model-era aliases / weighted fields
            "weighted_Ash": g("weighted_Ash", 0.0),
            "weighted_V.M.": g("weighted_VM", 0.0),
            "weighted_F.C": g("weighted_FC", 0.0),
            "weighted_Total Sulphur": g("weighted_S", 0.0),
            "weighted_Phosphorus": g("weighted_P", 0.0),
            "weighted_HGI (ASTM)": g("weighted_HGI", 0.0),
            "weighted_Rank": 0.0,  # Rank is categorical; use 0.0
            "weighted_Vitrinite %": g("weighted_Vitrinite", 0.0),
            "weighted_Liptinite": g("weighted_Liptinite", 0.0),
            "weighted_Semi-Fusinite": g("weighted_Semi_Fusinite", 0.0),
            "weighted_CSN/FSI": g("weighted_CSN_FSI", 0.0),
            "weighted_Initial Softening Temp.": g("weighted_Initial_Softening_Temp", 0.0),

            "weighted_CRI": g("weighted_CRI", 0.0),
            "weighted_CSR": g("weighted_CSR", 0.0),

            "weighted_C": g("weighted_C", 0.0),
            "weighted_H": g("weighted_H", 0.0),
            "weighted_N": g("weighted_N", 0.0),
            "weighted_O": g("weighted_O", 0.0),
            "weighted_S": g("weighted_S", 0.0),

            "weighted_BI": engineered.get("weighted_BI", 0.0),
            "weighted_MBI": engineered.get("weighted_MBI", 0.0),
            "weighted_CBI": engineered.get("weighted_CBI", 0.0),
            "weighted_Log_Max_Fluidity": engineered.get("weighted_Log_Max_Fluidity", 0.0),

            "CRI_direct": direct.get("CRI_direct", 0.0),
            "CSR_from_CRI": direct.get("CSR_from_CRI", 0.0),
            "CSR_direct": direct.get("CSR_direct", 0.0),
        }

        # enforce order & presence
        ordered = {k: final_features.get(k, 0.0) for k in FINAL_FEATURE_ORDER}
        self._print_section("Final Features (build_final_features)", ordered)
        return ordered

    # -------------------------
    # Column-wise normalization (scaler_colwise.pkl)
    # -------------------------
    def normalize_features(self, final_features: Dict[str, float]) -> Dict[str, float]:
        """
        Column-wise normalization using scaler_colwise.pkl.
        1) Drop CRI/CSR/ASH/VM
        2) Build vector in the scaler's training order (feature_names)
        3) Transform robustly (handles 1-feature scalers)
        4) Clip to scaler.feature_range (avoid negatives if range starts at 0)
        Returns: dict[name] -> scaled_value
        """
        # 1) Remove raw targets before scaling
        feats_for_scaler = {k: v for k, v in final_features.items() if k not in TARGET_COLUMNS}

        # 2) Ensure scaler exists
        if not hasattr(self, "colwise_scaler") or self.colwise_scaler is None:
            logger.warning("Column-wise scaler not loaded; returning unscaled features.")
            return feats_for_scaler

        # 3) Use training order if provided
        if getattr(self, "colwise_feature_names", None):
            # Guard against accidentally saved target names
            order = [name for name in self.colwise_feature_names if name not in TARGET_COLUMNS]
        else:
            order = list(feats_for_scaler.keys())

        # 4) Assemble vector; fill missing with per-feature min (or 0.0)
        vals = []
        data_min = getattr(self.colwise_scaler, "data_min_", None)
        for i, name in enumerate(order):
            if name in feats_for_scaler:
                vals.append(float(feats_for_scaler[name]))
            else:
                fill = 0.0
                if isinstance(data_min, np.ndarray) and data_min.shape[0] == len(order):
                    try:
                        fill = float(data_min[i])
                    except Exception:
                        pass
                vals.append(fill)

        X = np.array(vals, dtype=float).reshape(1, -1)

        # 5) Transform (with 1-feature fallback)
        try:
            X_scaled = self.colwise_scaler.transform(X)
        except Exception:
            try:
                X_scaled = self.colwise_scaler.transform(X.reshape(-1, 1)).reshape(1, -1)
                logger.warning("Column-wise scaler expects 1 feature; applied element-wise transform.")
            except Exception as e2:
                logger.error(f"Column-wise scaling failed: {e2}. Returning unscaled features.")
                return feats_for_scaler

        # 6) Optional clamp to feature_range
        try:
            fr = getattr(self.colwise_scaler, "feature_range", None)
            if isinstance(fr, tuple) and len(fr) == 2 and None not in fr:
                lo, hi = fr
                X_scaled = np.clip(X_scaled, float(lo), float(hi))
        except Exception:
            pass

        scaled = {name: float(X_scaled[0, i]) for i, name in enumerate(order)}
        # Keep any extra keys that weren't in 'order' (left unscaled)
        for k, v in feats_for_scaler.items():
            if k not in scaled:
                scaled[k] = float(v)

        self._print_section("Scaled Features (after column-wise normalize)", scaled)
        return scaled

    # -------------------------
    # Predict one target
    # -------------------------
    def predict_target(self, target: str, scaled_features: Dict[str, float]) -> float:
        """
        Build X from scaled_features using {TARGET}_features.pkl, then predict.
        Applies optional {TARGET}_scaler.pkl if present.
        """
        model = self.target_models.get(target)
        feats = self.target_features.get(target)
        if model is None or feats is None:
            logger.warning(f"Missing assets for {target} (model or features). Returning 0.0")
            return 0.0

        Xrow = {name: scaled_features.get(name, 0.0) for name in feats}
        X = pd.DataFrame([Xrow], columns=feats)

        # Optional per-target scaler
        tscaler = self.target_scalers.get(target)
        if tscaler is not None:
            try:
                X = tscaler.transform(X)
            except Exception as e:
                logger.warning(f"Target scaler failed for {target}: {e}. Using unscaled features.")

        try:
            y = model.predict(X)[0]
            return float(y)
        except Exception as e:
            logger.error(f"Model prediction failed for {target}: {e}")
            return 0.0

    # -------------------------
    # Predict all targets
    # -------------------------
    def predict_all(self, scaled_features: Dict[str, float]) -> Dict[str, float]:
        return {t: self.predict_target(t, scaled_features) for t in ["CRI", "CSR", "VM", "ASH"]}

    # -------------------------
    # Emissions
    # -------------------------
    def calculate_emissions(self, predictions: Dict[str, float], w: Dict[str, float]) -> Dict[str, float]:
        fc = predictions.get("FC", w.get("weighted_FC", 0.0))
        ash = predictions.get("ASH", w.get("weighted_Ash", 0.0))
        vm = predictions.get("VM", w.get("weighted_VM", 0.0))
        s = w.get("weighted_S", 0.0)
        n = w.get("weighted_N", 0.0)
        cri = predictions.get("CRI", w.get("weighted_CRI", 0.0))
        csr = predictions.get("CSR", w.get("weighted_CSR", 0.0))

        em = {}
        em["CO2_Emissions"] = 0.7 * (fc / 100) * (44.01 / 12.01) * 1000
        em["CO_Emissions"] = 0.3 * (fc / 100) * (28.01 / 12.01) * 1000
        em["SO2_Emissions"] = (s / 100) * (64.07 / 32.06) * 1000
        em["NO_Emissions"] = 0.2 * (n / 100) * (30.01 / 14.01) * 1000
        em["NO2_Emissions"] = 0.2 * (n / 100) * (46.01 / 14.01) * 1000
        pm_index = 0.4 * (ash / 9) + 0.3 * (cri / 28) + 0.3 * (1 - csr / 65)
        em["PM_Index"] = pm_index
        em["PM10_Emissions"] = 0.7 * pm_index
        em["PM25_Emissions"] = 0.3 * pm_index
        voc_index = 0.5 * (vm / 2.5) + 0.2 * (cri / 28) + 0.2 * (1 - csr / 65) + 0.1 * (n / 1.0)
        em["VOC_Index"] = voc_index
        em["VOC_Emissions"] = 0.9 * voc_index
        em["PAH_Emissions"] = 0.1 * voc_index
        return em

    # -------------------------
    # Orchestrator
    # -------------------------
    def run_inference(self, coal_properties: Dict[str, Any], blend_ratios: List[Dict]) -> Dict[str, Any]:
        """
        Returns:
          {
            "final_features":     <dict in the exact keys you requested>,
            "scaled_features":    <dict after dropping CRI/CSR/ASH/VM and applying column-wise scaler>,
            "predicted_targets":  {"CRI":..,"CSR":..,"VM":..,"ASH":..},
            "emissions":          { ... }
          }
        """
        # 1) Weighted
        w = self.calculate_weighted_averages(coal_properties, blend_ratios)

        # 2) Engineer
        engineered = self.engineer_features(w)
        w = {**w, **engineered}

        # 3) Direct formulas
        direct = self.calculate_direct_formulas(w)

        # 4) Final features (exact keys)
        final_features = self.build_final_features(w, engineered, direct)

        # 5) Scale (drop CRI/CSR/ASH/VM first, then column-wise normalize)
        scaled_features = self.normalize_features(final_features)

        # 6) Predict
        predicted_targets = self.predict_all(scaled_features)

        # 7) Emissions
        emissions = self.calculate_emissions(predicted_targets, w)

        # Debug sections
        self._print_section("Final Features", final_features)
        self._print_section("Scaled Features (after dropping CRI/CSR/ASH/VM)", scaled_features)
        self._print_section("Predicted Targets", predicted_targets)
        self._print_section("Emissions", emissions)

        return {
            "final_features": final_features,
            "scaled_features": scaled_features,
            "predicted_targets": predicted_targets,
            "emissions": emissions,
        }
