/**
 * Result<T, E> — monad ligero para errores explícitos sin excepciones.
 * Sin dependencias de framework.
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/** Type guard para narrowing en la rama de error. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return !result.ok;
}

/** Type guard para narrowing en la rama de éxito. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok;
}
