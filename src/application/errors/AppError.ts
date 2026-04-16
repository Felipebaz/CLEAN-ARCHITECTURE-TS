/**
 * Errores de aplicación modelados como unión discriminada de objetos planos.
 * Los casos de uso los producen; los controladores los mapean a respuestas HTTP.
 * No dependen de ningún framework.
 */

export type ValidationError = {
    readonly kind: 'validation';
    readonly message: string;
    /** Campo específico que falló la validación, si aplica. */
    readonly field?: string;
};

export type NotFoundError = {
    readonly kind: 'not_found';
    readonly resource: string;
    readonly id: string;
};

export type ConflictError = {
    readonly kind: 'conflict';
    readonly message: string;
};

/** Error de infraestructura: fallo de red, base de datos, servicio externo, etc. */
export type InfraError = {
    readonly kind: 'infra';
    readonly cause: unknown;
};

export type AppError = ValidationError | NotFoundError | ConflictError | InfraError;

// ---------------------------------------------------------------------------
// Factories — evitan construir los literales a mano en los casos de uso
// ---------------------------------------------------------------------------

export const AppError = {
    validation(message: string, field?: string): ValidationError {
        return field !== undefined
            ? { kind: 'validation', message, field }
            : { kind: 'validation', message };
    },
    notFound(resource: string, id: string): NotFoundError {
        return { kind: 'not_found', resource, id };
    },
    conflict(message: string): ConflictError {
        return { kind: 'conflict', message };
    },
    infra(cause: unknown): InfraError {
        return { kind: 'infra', cause };
    },
} as const;
