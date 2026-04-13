import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import json
import os
import random

print("Generating 100 fake user profiles...")
np.random.seed(42)
random.seed(42)

# Generate 100 unique users
n_users = 100

first_names = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya",
               "Saanvi", "Aanya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Navya", "Manya", "Aliya",
               "Rohan", "Kabir", "Dhruv", "Rudra", "Reyansh", "Aryan", "Atharv", "Om", "Samar", "Jian",
               "Zara", "Riya", "Myra", "Kiara", "Kavya", "Prisha", "Ira", "Nysa", "Kritika", "Ahana"]

occupations = ["Student (IIT Bombay)", "Student (DU)", "Software Engineer at Google", "Freelance Designer", 
               "Product Manager", "Data Scientist", "Marketing Intern", "Consultant", "Musician", "Architect"]

users = []
for i in range(1, n_users + 1):
    user = {
        "id": f"USER_{i:03d}",
        "name": f"{random.choice(first_names)} {random.choice(['S.', 'R.', 'K.', 'M.', 'P.', 'D.', 'A.'])}",
        "age": random.randint(18, 35),
        "budget": random.choice([8000, 12000, 15000, 20000, 25000, 30000, 40000]),
        "cleanliness": random.randint(1, 10),     # 1-10
        "sleep_time": random.randint(21, 28),     # 21 (9PM) to 28 (4AM)
        "personality": round(random.uniform(0, 1), 2), # 0 = Introvert, 1 = Extrovert
        "smoking": random.choice([0, 1]),         # 0 = No, 1 = Yes
        "occupation": random.choice(occupations),
        "bio": "Looking for a chill flatmate! Respects privacy but down to hang out."
    }
    users.append(user)

# Save the 100 users to a JSON for the frontend to potentially use
os.makedirs('public/data', exist_ok=True)
with open('public/data/fake_users.json', 'w') as f:
    json.dump(users, f, indent=2)
print(f"Saved 100 generated users to public/data/fake_users.json")

print("\nGenerating all possible pairwise matches...")
# Create pairwise combinations (100 * 99 / 2 = 4950 pairs)
pairs = []
for i in range(len(users)):
    for j in range(i + 1, len(users)):
        u1 = users[i]
        u2 = users[j]
        
        # Calculate pair features
        budget_diff = abs(u1['budget'] - u2['budget']) / 40000.0  # Normalized 0-1
        age_diff = abs(u1['age'] - u2['age'])
        cleanliness_match = 10 - abs(u1['cleanliness'] - u2['cleanliness']) # 10 is perfectly matched, 0 is worst
        sleep_overlap = 8 - abs(u1['sleep_time'] - u2['sleep_time']) # Max 8 hrs overlap typically
        sleep_overlap = max(0, sleep_overlap)
        personality_match = 1 - abs(u1['personality'] - u2['personality'])
        
        # Smoking match: 1 if both same, 0 if different
        smoking_match = 1 if u1['smoking'] == u2['smoking'] else 0
        
        pairs.append({
            'user1_id': u1['id'],
            'user2_id': u2['id'],
            'budget_diff': budget_diff,
            'age_diff': age_diff,
            'cleanliness_match': cleanliness_match,
            'sleep_overlap': sleep_overlap,
            'personality_match': personality_match,
            'smoking_match': smoking_match
        })

df = pd.DataFrame(pairs)

# Compatibility formula (same logic as before)
score = (
    (-2 * df['budget_diff']) +
    (-0.1 * df['age_diff']) +
    (0.4 * df['cleanliness_match']) +
    (0.3 * df['sleep_overlap']) +
    (2 * df['personality_match']) +
    (3 * df['smoking_match']) +
    np.random.normal(0, 1, len(df)) # Noise
)

# Binary Target: 1 if match is good (top ~40%), 0 otherwise
threshold = np.percentile(score, 60)
df['is_match'] = (score >= threshold).astype(int)

# Create train/test sets
X = df[['budget_diff', 'age_diff', 'cleanliness_match', 'sleep_overlap', 'personality_match', 'smoking_match']]
y = df['is_match']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\nTraining XGBoost on 4,950 unique pair possibilities...")
model = xgb.XGBClassifier(
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
print(f"Model Accuracy on paired data: {accuracy:.4f}")

# Save the trained model
os.makedirs('ml_models', exist_ok=True)
model_path = 'ml_models/roommate_xgboost_100_ids.json'
model.save_model(model_path)
print(f"Model saved to {model_path}")

# Optionally, save all match scores for these 100 users
# We can predict on all features cleanly exactly what the model thinks of each pair
df['predicted_match_prob'] = model.predict_proba(X)[:, 1]
# Convert prob to a 1-100 score for frontend display
df['match_percentage'] = (df['predicted_match_prob'] * 100).round().astype(int)

# Save only the meaningful matching info
matches_df = df[['user1_id', 'user2_id', 'match_percentage']]
matches_df.to_csv('public/data/matches_scores.csv', index=False)
print("Saved all 4,950 pairwise match percentages to public/data/matches_scores.csv")
