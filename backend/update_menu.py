import os
import re

models_dir = "/Users/awaisarif/Downloads/S.A.F.E.-Table-main 2/safetablefyp/public/models/3dModels"
images_dir = "/Users/awaisarif/Downloads/S.A.F.E.-Table-main 2/safetablefyp/public/models/PosterImage"

# Rename files to remove spaces
def rename_files(directory):
    files = []
    for f in os.listdir(directory):
        if not f.startswith('.'):
            new_name = f.replace(" ", "_").replace("..", ".")
            os.rename(os.path.join(directory, f), os.path.join(directory, new_name))
            files.append(new_name)
    return sorted(files)

models = rename_files(models_dir)
images = rename_files(images_dir)

# Match models to images and build data structures
items = []
categories = {
    'Dessert': ['pudding', 'ice_cream', 'cake', 'shake'],
    'Beverage': ['coffee', 'margerita', 'colada', 'mojito'],
}

def get_category(name):
    low = name.lower()
    if any(k in low for k in ['coffee', 'margerita', 'colada', 'mojito', 'shake']): return "Beverages"
    if any(k in low for k in ['pudding', 'ice_cream', 'cake']): return "Desserts"
    return "Main Course"

for img in images:
    base = os.path.splitext(img)[0]
    # Find matching model
    model = next((m for m in models if m.startswith(base) or m.replace("_", "") == base.replace("_", "") or os.path.splitext(m)[0] == base), None)
    if not model:
        # fuzzy match
        model = next((m for m in models if base[:5] in m), None)
    
    name = base.replace("_", " ").title()
    items.append({
        "name": name,
        "description": f"Delicious {name}",
        "price": 15.99,
        "category": get_category(name),
        "image_url": f"/models/PosterImage/{img}",
        "model_3d_url": f"/models/3dModels/{model}",
    })

# Format MENU_ITEMS
menu_items_str = "MENU_ITEMS = [\n"
for i in items:
    menu_items_str += f"""    {{
        "name": "{i['name']}",
        "description": "{i['description']}",
        "price": {i['price']},
        "category": "{i['category']}",
        "image_url": "{i['image_url']}",
        "model_3d_url": "{i['model_3d_url']}",
        "is_available": True, "stock_quantity": 50, "allergens": [],
        "prep_time_minutes": 15, "spice_level": 0, "is_vegetarian": False, "is_popular": True,
    }},\n"""
menu_items_str += "]"

# Format DUMMY_MODELS
dummy_models_str = "DUMMY_MODELS = [\n"
for idx, i in enumerate(items):
    dummy_models_str += f"""    {{
        "id": "model_{idx}",
        "name": "{i['name']}",
        "model_url": "{i['model_3d_url']}",
        "thumbnail_url": "{i['image_url']}",
        "category": "{i['category']}",
        "description": "3D model of {i['name']}",
    }},\n"""
dummy_models_str += "]"

# Replace in seed_data.py
seed_path = "/Users/awaisarif/Downloads/S.A.F.E.-Table-main 2/backend/seed_data.py"
with open(seed_path, 'r') as f:
    content = f.read()

content = re.sub(r'MENU_ITEMS = \[.*?\]\n\n\ndef _gen_order_id\(\):', f'{menu_items_str}\n\n\ndef _gen_order_id():', content, flags=re.DOTALL)

with open(seed_path, 'w') as f:
    f.write(content)

# Replace in models3d.py
models_path = "/Users/awaisarif/Downloads/S.A.F.E.-Table-main 2/backend/app/routes/models3d.py"
with open(models_path, 'r') as f:
    content = f.read()

content = re.sub(r'DUMMY_MODELS = \[.*?\]\n\n\n@router\.get\(""\)', f'{dummy_models_str}\n\n\n@router.get("")', content, flags=re.DOTALL)

with open(models_path, 'w') as f:
    f.write(content)

print("✅ Updated seed_data.py and models3d.py with 19 items")
