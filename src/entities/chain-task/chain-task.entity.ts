import { _ChainTask } from './chain-task-actions.entity'
import { _ChainTaskFormatter } from './chain-task.formatter'
import { _ChainTaskHelper } from './chain-task.helper'

/**
 * Namespace for ChainTask entity related functionality.
 * This namespace should contain types representing the entity's types and alias to `Helper` and `Formatter` namespaces.
 */
export namespace _ChainTaskEntity {
    export import Helper = _ChainTaskHelper
    export import Formatter = _ChainTaskFormatter
    export import Actions = _ChainTask.Actions

    export type BaseType = {
        userTelegramId: number
        creationDate: Date
        updateDate: Date
        state: 'pending' | 'issued'
        action: Actions.SomeAction
    }
}
