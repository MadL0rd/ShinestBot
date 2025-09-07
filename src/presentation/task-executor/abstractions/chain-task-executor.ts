import { ChainTask } from 'src/entities/chain-task'
import { UserProfile } from 'src/entities/user-profile'

export type ChainTaskExecutor<ResourceType extends ChainTask.Actions.ResourceType> = {
    [Action in ChainTask.Actions.ActionsWithResourceType<ResourceType> as Action['actionType']]: (
        user: UserProfile.BaseType,
        action: Action
    ) => Promise<boolean>
}
