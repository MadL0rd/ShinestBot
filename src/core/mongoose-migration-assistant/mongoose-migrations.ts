import { LoggerService } from '@nestjs/common'
import mongoose, { Model, RootFilterQuery, Types, UpdateQuery } from 'mongoose'
import { Prettify } from 'src/entities/common/prettify.type'

export namespace MongooseMigrations {
    type SupportedVersionTag = string | number | null | undefined

    type VersionString<VersionTag extends SupportedVersionTag> = VersionTag extends undefined
        ? 'undefined'
        : VersionTag extends null
          ? 'null'
          : `${VersionTag}`

    export type inferVersionTagType<Schema> =
        Schema extends VersionTagSchema<infer VersionCurrent, infer VersionLegacy>
            ? VersionCurrent | VersionLegacy
            : never

    export class VersionTagSchema<
        VersionCurrent extends SupportedVersionTag,
        VersionLegacy extends Exclude<SupportedVersionTag, VersionCurrent>,
    > {
        readonly currentVersion: VersionCurrent
        readonly legacyVersions: VersionLegacy[]

        /**
         * Values order:
         * [...`legacyVersions`, `currentVersion`]
         */
        readonly allCases: (VersionCurrent | VersionLegacy)[]
        readonly nextVersions: Record<VersionString<VersionLegacy>, VersionCurrent | VersionLegacy>

        /**
         * Provided options:
         * @prop `type`: `Mixed` if contain strings and numbers; `Number` if does not contain string; `String` by default
         * @prop `required`: `false` if contain `undefined` or `null`, else `true`
         * @prop `index`: `true`
         * @prop `enum`: all values if not contain `undefined`
         * @prop `default`: `currentVersion`
         */
        readonly schemaTypeOptions: mongoose.SchemaTypeOptions<SupportedVersionTag>

        constructor(args: {
            readonly currentVersion: VersionCurrent
            readonly legacyVersions: VersionLegacy[]
        }) {
            Object.assign(this, args)

            const allCases: SupportedVersionTag[] = this.legacyVersions.slice()
            allCases.push(this.currentVersion)
            this.allCases = allCases as typeof this.allCases

            this.nextVersions = this.allCases.reduce((acc, item, index, versions) => {
                acc[`${item}`] =
                    versions.length === index ? this.currentVersion : versions[index + 1]
                return acc
            }, {} as any)

            const contain = this.allCases.reduce(
                (acc, item) => {
                    switch (typeof item) {
                        case 'string':
                            acc.string = true
                            break

                        case 'number':
                            acc.number = true
                            break

                        case 'undefined':
                            acc.undefined = true
                            break

                        case 'object':
                            if (item === null) acc.null = true
                            break

                        default:
                            break
                    }
                    return acc
                },
                { undefined: false, null: false, string: false, number: false }
            )

            this.schemaTypeOptions = {
                type:
                    contain.string && contain.number
                        ? mongoose.Schema.Types.Mixed
                        : contain.number
                          ? mongoose.Schema.Types.Number
                          : mongoose.Schema.Types.String,
                required: !contain.undefined && !contain.null,
                index: true,
                enum: contain.undefined
                    ? undefined
                    : (this.allCases as Exclude<SupportedVersionTag, undefined>[]),
                default: this.currentVersion,
            }
        }
    }

    type ProjectionOptions<Document> = {
        readonly [Key in keyof Document]?: 1 | 0 | true | false | undefined
    }
    type MigrationsConfigurationUpdateStrategy<
        DocumentType,
        DocumentVersionKey extends keyof DocumentType,
    > =
        | {
              readonly type: 'updateMany'
              readonly update: UpdateQuery<Omit<DocumentType, DocumentVersionKey>>
          }
        | {
              readonly type: 'cursor'
              readonly cursorBatchSize: number
              readonly projection?: ProjectionOptions<DocumentType>
              readonly generateDocUpdate: (
                  doc: DocumentType
              ) => UpdateQuery<Omit<DocumentType, DocumentVersionKey>>
          }
        | {
              readonly type: 'cursorAsync'
              readonly cursorBatchSize: number
              readonly projection?: ProjectionOptions<DocumentType>
              readonly generateDocUpdate: (
                  doc: DocumentType
              ) => Promise<UpdateQuery<Omit<DocumentType, DocumentVersionKey>>>
          }
        | {
              readonly type: 'manual'
              readonly migrate: (model: Model<DocumentType>) => Promise<{ modifiedCount: number }>
          }

    type MigrationsConfigurationFunctionName<VersionLegacy extends SupportedVersionTag> =
        `updateFrom${Capitalize<VersionString<VersionLegacy>>}`
    export type MigrationsConfiguration<
        DocumentType,
        DocumentVersionKey extends keyof DocumentType,
        VersionLegacy extends SupportedVersionTag,
    > = Prettify<{
        [Version in VersionLegacy as MigrationsConfigurationFunctionName<Version>]: MigrationsConfigurationUpdateStrategy<
            DocumentType,
            DocumentVersionKey
        >
    }>

    export class Assistant<
        DocumentType extends { readonly _id: Types.ObjectId },
        DocumentVersionKey extends keyof DocumentType,
        DocumentVersionTag extends DocumentType[DocumentVersionKey] & SupportedVersionTag,
        VersionCurrent extends DocumentVersionTag,
        VersionLegacy extends Exclude<DocumentVersionTag, VersionCurrent>,
    > {
        readonly model: Model<DocumentType>
        readonly documentVersionKey: DocumentVersionKey
        readonly currentVersion: VersionCurrent
        readonly legacyVersions: VersionLegacy[]
        readonly migrationsConfiguration: MigrationsConfiguration<
            DocumentType,
            DocumentVersionKey,
            VersionLegacy
        >
        logger: LoggerService

        readonly allCases: DocumentVersionTag[]
        readonly nextVersions: Record<VersionString<VersionLegacy>, DocumentVersionTag>

        constructor(args: {
            readonly model: Model<DocumentType>
            readonly documentVersionKey: DocumentVersionKey
            readonly currentVersion: VersionCurrent
            readonly legacyVersions: VersionLegacy[]
            readonly migrationsConfiguration: MigrationsConfiguration<
                DocumentType,
                DocumentVersionKey,
                VersionLegacy
            >
            logger?: LoggerService
        }) {
            if (!args.logger) args.logger = console
            Object.assign(this, args)

            const allCases: DocumentVersionTag[] = this.legacyVersions.slice()
            allCases.push(this.currentVersion)
            this.allCases = allCases
            this.nextVersions = this.allCases.reduce((acc, item, index, versions) => {
                acc[`${item}`] =
                    versions.length === index ? this.currentVersion : versions[index + 1]
                return acc
            }, {} as any)
        }

        async runMigrations() {
            this.logger.log(`Migrations on '${this.model.collection.name}': start`)
            const migrations = await Promise.all(
                this.legacyVersions.map(async (version) => {
                    const filter = this.getVersionTagMongoFilter(version)
                    const enabled = await this.model.exists(filter)
                    return {
                        filter,
                        fromVersion: version,
                        toVersion: this.getNextVersion(version),
                        enabled: enabled ? true : false,
                    }
                })
            )

            if (migrations.isEmpty) return
            this.logger.log(
                `Migrations on '${this.model.collection.name}':\n${migrations.map((migration) => `\tfrom '${migration.fromVersion}' to '${migration.toVersion}' enabled: ${migration.enabled}`)}`
            )

            // That mean trigger of all other migrations chain
            let atLeastOneMigrationWasExecuted = false
            for (const migration of migrations) {
                if (migration.enabled === false && atLeastOneMigrationWasExecuted === false) {
                    continue
                }

                atLeastOneMigrationWasExecuted = true
                try {
                    const updateStrategy = this.getUpdateStrategyFromVersion(migration.fromVersion)
                    if (!updateStrategy) {
                        throw Error(
                            `migrationsConfiguration has no update strategy for version '${migration.fromVersion}'`
                        )
                    }

                    let result = { modifiedCount: 0 }
                    switch (updateStrategy.type) {
                        case 'updateMany':
                            result = await this.model.updateMany(
                                migration.filter,
                                this.applyNewVersionValueToUpdate(
                                    updateStrategy.update,
                                    migration.toVersion
                                )
                            )
                            break

                        case 'manual':
                            result = await updateStrategy.migrate(this.model)
                            break

                        case 'cursor':
                        case 'cursorAsync':
                            result = await this.runCursorMigration(
                                migration.fromVersion,
                                migration.toVersion,
                                updateStrategy
                            )
                    }
                    const { modifiedCount } = result

                    this.logger.log(
                        `COMPLETED Migration on '${this.model.collection.name}' from '${migration.fromVersion}' to '${migration.toVersion}'. Modified docs count: ${modifiedCount}`
                    )
                } catch (error) {
                    this.logger.error(
                        `FAILED Migration on '${this.model.collection.name}' from version '${migration.fromVersion}' to '${migration.toVersion}'.`,
                        error
                    )
                    throw error
                }
            }
        }

        private getVersionString<VersionType extends DocumentVersionTag>(
            version: VersionType
        ): VersionString<VersionType> {
            return `${version}` as VersionString<VersionType>
        }

        private getNextVersion(version: VersionLegacy): DocumentVersionTag {
            return this.nextVersions[this.getVersionString(version)]
        }

        private getUpdateStrategyFromVersion(
            version: VersionLegacy
        ): MigrationsConfigurationUpdateStrategy<DocumentType, DocumentVersionKey> | null {
            if (!this.migrationsConfiguration) return null

            const versionString = this.getVersionString(version)
            const updateStrategyKey =
                'updateFrom' + versionString[0].toUpperCase() + versionString.substring(1)
            const migrationsConfiguration = this.migrationsConfiguration as any

            return migrationsConfiguration[updateStrategyKey] ?? null
        }

        private getVersionTagMongoFilter(version: VersionLegacy): RootFilterQuery<DocumentType> {
            return {
                [this.documentVersionKey]: version === undefined ? { $exists: false } : version,
            } as any
        }

        private applyNewVersionValueToUpdate(
            update: UpdateQuery<Omit<DocumentType, DocumentVersionKey>> & { [k: string]: any },
            toVersion: DocumentVersionTag
        ): UpdateQuery<DocumentType> {
            const updateContainMongoOperators = Object.keys(update).some((key) =>
                key.startsWith('$')
            )
            if (updateContainMongoOperators) {
                if (update.$set) {
                    Object.assign(update.$set as {}, { [this.documentVersionKey]: toVersion })
                } else {
                    Object.assign(update as {}, { $set: { [this.documentVersionKey]: toVersion } })
                }
                return update as UpdateQuery<DocumentType>
            } else {
                return {
                    $set: {
                        ...update,
                        [this.documentVersionKey]: toVersion,
                    },
                }
            }
        }

        private async runCursorMigration(
            fromVersion: VersionLegacy,
            toVersion: DocumentVersionTag,
            updateStrategy: Extract<
                MigrationsConfigurationUpdateStrategy<DocumentType, DocumentVersionKey>,
                { type: 'cursor' | 'cursorAsync' }
            >
        ): Promise<{ modifiedCount: number }> {
            const filter = this.getVersionTagMongoFilter(fromVersion)

            const batchSize = updateStrategy.cursorBatchSize
            let modifiedCount = 0
            const batch: Parameters<typeof this.model.bulkWrite>[0] = []
            const promisesBatch: Promise<void>[] = []
            const cursor = this.model
                .find(filter, updateStrategy.projection)
                .lean()
                .cursor({ batchSize })

            for await (const doc of cursor) {
                if (updateStrategy.type === 'cursor') {
                    const update = this.applyNewVersionValueToUpdate(
                        updateStrategy.generateDocUpdate(doc as any),
                        toVersion
                    )
                    batch.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update,
                        },
                    })
                } else {
                    promisesBatch.push(
                        updateStrategy.generateDocUpdate(doc as any).then((result) => {
                            const update = this.applyNewVersionValueToUpdate(result, toVersion)
                            batch.push({
                                updateOne: {
                                    filter: { _id: doc._id },
                                    update,
                                },
                            })
                        })
                    )
                }

                if (promisesBatch.length === batchSize) {
                    await Promise.all(promisesBatch)
                    promisesBatch.length = 0
                }
                if (batch.length === batchSize) {
                    await this.model.bulkWrite(batch, {
                        ordered: true,
                        writeConcern: { w: 'majority', journal: true },
                    })
                    modifiedCount += batch.length
                    batch.length = 0
                }
            }

            if (promisesBatch.length === batchSize) {
                await Promise.all(promisesBatch)
                promisesBatch.length = 0
            }
            if (batch.isNotEmpty) {
                await this.model.bulkWrite(batch, {
                    ordered: true,
                    writeConcern: { w: 'majority', journal: true },
                })
                modifiedCount += batch.length
                batch.length = 0
            }

            return { modifiedCount }
        }
    }
}
