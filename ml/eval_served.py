#!/usr/bin/env python3
"""Evaluează modelul SERVIT (q50) pe test + baseline CMA pe același split,
regenerează graficele pentru teză (accuracy + importanță)."""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "src"))
import numpy as np, pandas as pd, joblib
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import r2_score
from features import FeaturePipeline, get_model_feature_cols

PICS = "/Users/kirill/domaris/thesis/pics"; NAVY = "#1F4E79"
pipeline = FeaturePipeline.load("models/feature_pipeline_v1.pkl")
q50 = joblib.load("models/lgbm_q50_v1.pkl")
feat_cols = joblib.load("models/feature_cols_v1.pkl")

df = pd.read_csv("data/real_transactions.csv", parse_dates=["transaction_date"])
df = df.sort_values("transaction_date").reset_index(drop=True)
n = len(df); i_tr = int(n*0.70); i_va = int(n*0.85)
tr, te = df.iloc[:i_tr].copy(), df.iloc[i_va:].copy()
te_t = pipeline.transform(te)
Xte = te_t[feat_cols].values.astype(float)
true = te_t["sale_price_eur"].values.astype(float)

def metrics(true, pred):
    ape = np.abs(pred-true)/true
    return dict(mae=np.mean(np.abs(pred-true)), rmse=np.sqrt(np.mean((pred-true)**2)),
               mape=ape.mean()*100, medape=np.median(ape)*100, r2=r2_score(true,pred),
               p20=(ape<=0.20).mean()*100, p10=(ape<=0.10).mean()*100)

ml_pred = q50.predict(Xte)
ml = metrics(true, ml_pred)

# CMA: mediana €/mp pe (property_type, city[, neighborhood]) din train
tr["ppsqm"] = tr["sale_price_eur"]/tr["surface_sqm"]
g2 = tr.groupby(["property_type","city"])["ppsqm"].median()
g1 = tr.groupby(["property_type"])["ppsqm"].median()
g0 = tr["ppsqm"].median()
def cma_ppsqm(r):
    for key,g in [((r["property_type"],r["city"]),g2),((r["property_type"],),g1)]:
        k = key if len(key)>1 else key[0]
        if k in g.index: return g.loc[k]
    return g0
cma_pred = np.array([cma_ppsqm(r)*r["surface_sqm"] for _,r in te_t.iterrows()])
cma = metrics(true, cma_pred)

print("=== MODEL SERVIT (q50) ==="); print({k:round(v,2) for k,v in ml.items()})
print("=== BASELINE CMA ===");       print({k:round(v,2) for k,v in cma.items()})

# --- Grafic 1: accuracy CMA vs ML ---
fig, axes = plt.subplots(1,2,figsize=(9.2,4.5),sharex=True,sharey=True); lim=400
for ax,(title,pred,m,color) in zip(axes,[
        ("Baseline CMA (comparabile)",cma_pred,cma,"#B0733A"),
        ("Model ML — Riva-AVM v1 (LightGBM)",ml_pred,ml,NAVY)]):
    ax.scatter(true/1000,pred/1000,s=6,alpha=0.25,color=color,edgecolors="none")
    ax.plot([0,lim],[0,lim],"--",color="#444",lw=1.1); ax.set_xlim(0,lim); ax.set_ylim(0,lim)
    ax.set_title(title,fontsize=10); ax.set_xlabel("Preț real (mii EUR)",fontsize=9)
    ax.text(0.04,0.92,f"MAPE = {m['mape']:.1f}%\n$R^2$ = {m['r2']:.3f}",transform=ax.transAxes,
            fontsize=9.5,va="top",bbox=dict(boxstyle="round,pad=0.35",fc="white",ec=color,alpha=0.9))
    ax.grid(True,ls=":",lw=0.5,alpha=0.5)
axes[0].set_ylabel("Preț estimat (mii EUR)",fontsize=9); fig.tight_layout()
fig.savefig(f"{PICS}/avm_accuracy.pdf",bbox_inches="tight"); plt.close(fig); print("✓ avm_accuracy.pdf")

# --- Grafic 2: importanță (gain q50) ---
imp = pd.DataFrame({"f":feat_cols,"gain":q50.booster_.feature_importance("gain")})
imp["pct"]=imp["gain"]/imp["gain"].sum()*100
lbl={"surface_sqm":"Suprafață","city_chișinău":"Oraș: Chișinău","neighborhood_encoded":"Cartier (target-enc)",
 "building_age":"Vârstă clădire","dist_to_center_km":"Distanță centru","total_floors":"Total etaje",
 "floor_ratio":"Raport etaj","transaction_year":"An tranzacție","amenities_count":"Nr. facilități",
 "zone_cluster":"Micro-zonă","property_type_apartment":"Tip: apartament","property_type_house":"Tip: casă",
 "floor":"Etaj","rooms":"Camere","is_furnished":"Mobilat"}
top=imp.sort_values("pct",ascending=False).head(12).iloc[::-1]
names=[lbl.get(f,f) for f in top["f"]]
fig,ax=plt.subplots(figsize=(8.4,5.0)); ax.barh(names,top["pct"],color=NAVY,alpha=0.88)
for y,v in enumerate(top["pct"]): ax.text(v+0.3,y,f"{v:.1f}%",va="center",fontsize=8.5,color="#333")
ax.set_xlabel("Contribuție la model (% din gain-ul total)",fontsize=9.5); ax.set_xlim(0,top["pct"].max()*1.15)
ax.grid(True,axis="x",ls=":",lw=0.5,alpha=0.5); ax.tick_params(labelsize=9); fig.tight_layout()
fig.savefig(f"{PICS}/avm_feature_importance.pdf",bbox_inches="tight"); plt.close(fig); print("✓ avm_feature_importance.pdf")
print("\nTOP 8:", [(lbl.get(f,f),round(p,1)) for f,p in zip(top['f'][::-1],top['pct'][::-1])][:8])
