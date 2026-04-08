
const errorData = {
    "success": false,
    "error": "Internal Server Error",
    "stack": "Error: Ya existe una relación familiar entre Patricio Gonzalez y Manuel Gonzalez\n    at FamiliarService.createFamiliar (/home/francisco/PROYECTOS/SIGESDA/SIGESDA-BACKEND/src/services/familiar.service.ts:70:13)\n    at FamiliarController.createFamiliar (/home/francisco/PROYECTOS/SIGESDA/SIGESDA-BACKEND/src/controllers/familiar.controller.ts:22:24)"
};

let errorMessage = errorData.error || "HTTP error";

if (errorData.stack && errorData.stack.includes('Ya existe una relación familiar')) {
    errorMessage = 'Ya existe una relación familiar entre estas dos personas.';
} else if (errorMessage === 'Internal Server Error' && errorData.stack) {
    if (errorData.stack.includes('Unique constraint failed')) {
        errorMessage = 'Ya existe este registro en la base de datos.';
    }
}

console.log("Parsed Error Message:", errorMessage);

if (errorMessage === 'Ya existe una relación familiar entre estas dos personas.') {
    console.log("SUCCESS: Error correctly parsed.");
} else {
    console.log("FAILURE: Error NOT correctly parsed.");
}
