from fastapi import APIRouter

router = APIRouter(prefix="/api/models3d", tags=["3D Models"])

# Dummy 3D model data (placeholder until real models are developed)
# Place actual .glb files in safetablefyp/public/models/ to serve from Vite,
# or in a backend /static/models/ directory for FastAPI static serving.
DUMMY_MODELS = [
    {
        "id": "model_0",
        "name": "Caramel Pudding",
        "model_url": "/models/3dModels/Caramel_Pudding.glb",
        "thumbnail_url": "/models/PosterImage/Caramel_Pudding.png",
        "category": "Desserts",
        "description": "3D model of Caramel Pudding",
    },
    {
        "id": "model_1",
        "name": "Chocolate Ice Cream",
        "model_url": "/models/3dModels/Chocolate_Ice_Cream.glb",
        "thumbnail_url": "/models/PosterImage/Chocolate_Ice_Cream.png",
        "category": "Main Course",
        "description": "3D model of Chocolate Ice Cream",
    },
    {
        "id": "model_2",
        "name": "Classis Beef Burgers",
        "model_url": "/models/3dModels/Classis_Beef_Burgers.glb",
        "thumbnail_url": "/models/PosterImage/Classis_Beef_Burgers.png",
        "category": "Main Course",
        "description": "3D model of Classis Beef Burgers",
    },
    {
        "id": "model_3",
        "name": "Cold Coffee",
        "model_url": "/models/3dModels/Cold_Coffee.glb",
        "thumbnail_url": "/models/PosterImage/Cold_Coffee.png",
        "category": "Beverages",
        "description": "3D model of Cold Coffee",
    },
    {
        "id": "model_4",
        "name": "Creamy Chicken Alfredo Pasta",
        "model_url": "/models/3dModels/Creamy_Chicken_Alfredo_Pasta.glb",
        "thumbnail_url": "/models/PosterImage/Creamy_Chicken_Alfredo_Pasta.png",
        "category": "Main Course",
        "description": "3D model of Creamy Chicken Alfredo Pasta",
    },
    {
        "id": "model_5",
        "name": "Crispy Fried Chicken",
        "model_url": "/models/3dModels/Crispy_Fried_Chicken.glb",
        "thumbnail_url": "/models/PosterImage/Crispy_Fried_Chicken.png",
        "category": "Main Course",
        "description": "3D model of Crispy Fried Chicken",
    },
    {
        "id": "model_7",
        "name": "Katsuobushi Poutine",
        "model_url": "/models/3dModels/Katsuobushi_Poutine.glb",
        "thumbnail_url": "/models/PosterImage/Katsuobushi_Poutine.png",
        "category": "Main Course",
        "description": "3D model of Katsuobushi Poutine",
    },
    {
        "id": "model_8",
        "name": "Margherita Pizza",
        "model_url": "/models/3dModels/Margherita_pizza.glb",
        "thumbnail_url": "/models/PosterImage/Margherita_pizza.png",
        "category": "Main Course",
        "description": "3D model of Margherita Pizza",
    },
    {
        "id": "model_9",
        "name": "Mint Margerita",
        "model_url": "/models/3dModels/Mint_Margerita.glb",
        "thumbnail_url": "/models/PosterImage/Mint_Margerita.png",
        "category": "Beverages",
        "description": "3D model of Mint Margerita",
    },
    {
        "id": "model_10",
        "name": "New York Pizza",
        "model_url": "/models/3dModels/New_York_Pizza.glb",
        "thumbnail_url": "/models/PosterImage/New_York_Pizza.png",
        "category": "Main Course",
        "description": "3D model of New York Pizza",
    },
    {
        "id": "model_11",
        "name": "Oreo Shake",
        "model_url": "/models/3dModels/Oreo_shake.glb",
        "thumbnail_url": "/models/PosterImage/Oreo_shake.png",
        "category": "Beverages",
        "description": "3D model of Oreo Shake",
    },
    {
        "id": "model_12",
        "name": "Pepperoni Pizza",
        "model_url": "/models/3dModels/Pepperoni_Pizza.glb",
        "thumbnail_url": "/models/PosterImage/Pepperoni_Pizza.png",
        "category": "Main Course",
        "description": "3D model of Pepperoni Pizza",
    },
    {
        "id": "model_13",
        "name": "Pina Colada",
        "model_url": "/models/3dModels/Pina_Colada.glb",
        "thumbnail_url": "/models/PosterImage/Pina_Colada.png",
        "category": "Beverages",
        "description": "3D model of Pina Colada",
    },
    {
        "id": "model_14",
        "name": "Raspberry Drizzled Cheese Cake",
        "model_url": "/models/3dModels/Raspberry_drizzled_cheese_cake.glb",
        "thumbnail_url": "/models/PosterImage/Raspberry_drizzled_cheese_cake.png",
        "category": "Desserts",
        "description": "3D model of Raspberry Drizzled Cheese Cake",
    },
    {
        "id": "model_15",
        "name": "S.A.F.E Special Burger Combo",
        "model_url": "/models/3dModels/S.A.F.E_Special_Burger_combo.glb",
        "thumbnail_url": "/models/PosterImage/S.A.F.E_Special_Burger_combo.png",
        "category": "Main Course",
        "description": "3D model of S.A.F.E Special Burger Combo",
    },
    {
        "id": "model_16",
        "name": "Strawberry Mojito",
        "model_url": "/models/3dModels/Strawberry_Mojito.glb",
        "thumbnail_url": "/models/PosterImage/Strawberry_Mojito.png",
        "category": "Beverages",
        "description": "3D model of Strawberry Mojito",
    },
    {
        "id": "model_17",
        "name": "Tomahawk Steak",
        "model_url": "/models/3dModels/Tomahawk_Steak.glb",
        "thumbnail_url": "/models/PosterImage/Tomahawk_Steak.png",
        "category": "Main Course",
        "description": "3D model of Tomahawk Steak",
    },
    {
        "id": "model_18",
        "name": "Beef Tenderloin Steak",
        "model_url": "/models/3dModels/beef_tenderloin_steak.glb",
        "thumbnail_url": "/models/PosterImage/beef_tenderloin_steak.png",
        "category": "Main Course",
        "description": "3D model of Beef Tenderloin Steak",
    },
    {
        "id": "model_19",
        "name": "Aquafina Water",
        "model_url": "/models/3dModels/Aquafina_Bottled_Water.glb",
        "thumbnail_url": "/models/PosterImage/Aquafina_Water.png",
        "category": "Beverages",
        "description": "3D model of Aquafina Water",
    },
]


@router.get("")
async def get_all_models():
    """Get all available 3D models (dummy placeholders)."""
    return {"models": DUMMY_MODELS, "total": len(DUMMY_MODELS)}


@router.get("/{model_id}")
async def get_model(model_id: str):
    """Get a specific 3D model by ID."""
    model = next((m for m in DUMMY_MODELS if m["id"] == model_id), None)
    if not model:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="3D model not found")
    return model


@router.get("/menu-item/{item_name}")
async def get_model_by_menu_item(item_name: str):
    """Get 3D model associated with a menu item name."""
    model = next(
        (m for m in DUMMY_MODELS if m["name"].lower() == item_name.lower()),
        None
    )
    if not model:
        return {"message": "No 3D model available for this item", "model": None}
    return model
