// Тип исходного replacer‑функции, которая принимает (key, value, path)
// и возвращает любое значение. Обратите внимание, что this имеет тип any.
type Replacer = (this: any, key: string, value: any, path: string) => any

/**
 * Декоратор replacerWithPath принимает replacer, добавляет к нему третий параметр `path`,
 * содержащий полный путь до текущего ключа при обходе объекта JSON.stringify.
 *
 * @param replacer исходная функция, которая будет вызвана с (key, value, path)
 * @returns новую функцию-заменитель, совместимую с JSON.stringify
 */
export function replacerWithPath(replacer: Replacer): (this: any, key: string, value: any) => any {
    // Map для хранения соответствия объектов и их путей.
    const pathMap: Map<any, string> = new Map()

    return function (this: any, key: string, value: any): any {
        // Получаем путь родителя. Если его нет (для корневого объекта) вернется undefined,
        // который заменим на пустую строку.
        const parentPath: string = pathMap.get(this) || ''

        // Если this является массивом, то ключ формируется как индекс в квадратных скобках,
        // иначе — в формате ".field".
        const appended = Array.isArray(this) ? `[${key}]` : key ? `${key}` : ''

        // Формируем полный путь. Если не установлен путь для родителя, то он будет пустой.
        const path = [parentPath, appended].filter(Boolean).join('.')

        // Если значение является объектом (включая массивы) и не null,
        // то сохраняем его путь в Map для дальнейшего обхода.
        if (value !== null && typeof value === 'object') {
            pathMap.set(value, path)
        }

        // Вызываем переданный replacer с дополнительным аргументом path.
        return replacer.call(this, key, value, path)
    }
}
