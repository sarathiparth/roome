import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import json
import os

print("Generating synthetic data for roommate matching...")
np.random.seed(42)

# Generate 5000 fake samples
n_samples = 5000

# Features
# 1. Budget Difference (absolute difference in budgets, normalized 0-1)
budget_diff = np.random.beta(2, 5, n_samples)

# 2. Age Difference (absolute difference in years)
age_diff = np.random.randint(0, 15, n_samples)

# 3. Cleanliness Compatibility (0 to 10 scale, 10 is perfectly matched)
cleanliness_match = np.random.randint(1, 11, n_samples)

# 4. Sleep Schedule Overlap (Hours overlap, 0-8)
sleep_overlap = np.random.randint(0, 9, n_samples)

# 5. Introvert/Extrovert alignment (0 to 1, higher is better aligned)
personality_match = np.random.uniform(0, 1, n_samples)

# 6. Smoking Compatibility (0 or 1, 1 if both don't smoke or both smoke or one doesn't care)
smoking_match = np.random.choice([0, 1], n_samples, p=[0.2, 0.8])

# Fake compatibility formula to create target (with some noise)
# Higher features typically mean higher compatibility except budget_diff and age_diff
score = (
    (-2 * budget_diff) +
    (-0.1 * age_diff) +
    (0.4 * cleanliness_match) +
    (0.3 * sleep_overlap) +
    (2 * personality_match) +
    (3 * smoking_match) +
    np.random.normal(0, 1, n_samples) # Noise
)

# Binary Target: 1 if match is good (top ~40%), 0 otherwise
threshold = np.percentile(score, 60)
is_match = (score >= threshold).astype(int)

# Create DataFrame
df = pd.DataFrame({
    'budget_diff': budget_diff,
    'age_diff': age_diff,
    'cleanliness_match': cleanliness_match,
    'sleep_overlap': sleep_overlap,
    'personality_match': personality_match,
    'smoking_match': smoking_match,
    'is_match': is_match
})

print(f"Data generated. Class distribution:")
print(df['is_match'].value_counts(normalize=True))

# Prepare for modeling
X = df.drop('is_match', axis=1)
y = df['is_match']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\nTraining XGBoost model...")
# Train XGBoost
model = xgb.XGBClassifier(
    objective='binary:logistic',
    n_estimators=100,
    learning_rate=0.1,
    max_depth=4,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X_train, y_train)

# Predict and Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nModel Evaluation:")
print(f"Accuracy: {accuracy:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Get feature importance
importance = model.feature_importances_
feat_imp = pd.DataFrame({
    'Feature': X.columns,
    'Importance': importance
}).sort_values(by='Importance', ascending=False)

print("\nFeature Importance:")
print(feat_imp.to_string(index=False))

# Save model
os.makedirs('ml_models', exist_ok=True)
model_path = 'ml_models/roommate_xgboost.json'
model.save_model(model_path)
print(f"\nModel saved to {model_path}")
