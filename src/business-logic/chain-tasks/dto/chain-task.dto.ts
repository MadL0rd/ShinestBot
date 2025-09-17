import { ChainTask } from 'src/entities/chain-task'
import { OmitFields } from 'src/entities/common/utility-types-extensions'

export type ChainTaskCreateDto = OmitFields<
    ChainTask.BaseType,
    'creationDate' | 'updateDate' | 'state'
>
