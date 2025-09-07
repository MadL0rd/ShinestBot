import { MediaGroupMessageContext } from './combine-media-group'
import { MessageContextTyped, MessageTyped } from './inject-message-types'

export type ExtendedMessageContext = MessageContextTyped & MediaGroupMessageContext
export type ExtendedMessage = MessageTyped
