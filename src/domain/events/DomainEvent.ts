export interface DomainEvent {
    /** Identifica el tipo de evento. Debe ser un literal estático en cada implementación. */
    readonly eventType: string;
    /** ID del aggregate que originó el evento. */
    readonly aggregateId: string;
    /** Cuándo ocurrió el evento. */
    readonly occurredAt: Date;
}
