"use client"

import { CircleHelp, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useReducer } from "react"
import { toast } from "sonner"

import { deleteEntityAction, getEntitiesAction } from "@/actions/entity.action"
import { EntityDialog } from "@/components/entity-management/entity-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { handleSafeActionResult } from "@/lib/utils.client"
import { EntityModel as Entity } from "@/prisma/generated/models/Entity"
import { useConfirm } from "@/provider/ConfirmationProvider"
import { EntityUsers } from "@/types/entity.type"
import { SessionUser } from "@/types/user.type"

type EntityManagementProps = {
    sessionUser: SessionUser
    preloadedEntities: EntityUsers[]
}

type EntityManagementState = {
    entities: EntityUsers[]
    isDialogOpen: boolean
    editingEntity: Entity | null
    isDeleting: boolean
    searchQuery: string
}

type EntityManagementAction = {
    type: "merge"
    payload: Partial<EntityManagementState>
}

const entityManagementReducer = (
    state: EntityManagementState,
    action: EntityManagementAction,
): EntityManagementState => {
    return { ...state, ...action.payload }
}

export function EntityManagement({ sessionUser, preloadedEntities }: EntityManagementProps) {
    const [state, dispatch] = useReducer(entityManagementReducer, {
        entities: preloadedEntities,
        isDialogOpen: false,
        editingEntity: null,
        isDeleting: false,
        searchQuery: "",
    })

    const canCreateEntity = sessionUser.Permissions.some((permission) => permission.code === "entity_create")
    const canEditEntity = sessionUser.Permissions.some((permission) => permission.code === "entity_edit")

    const t = useTranslations("EntityManagement")
    const tErrors = useTranslations("Errors")
    const tCommon = useTranslations("Common")
    const { confirm } = useConfirm()

    const filteredEntities = state.entities.filter((entity) =>
        entity.name.toLowerCase().includes(state.searchQuery.toLowerCase()),
    )

    const handleCreateEntity = () => {
        dispatch({
            type: "merge",
            payload: { editingEntity: null, isDialogOpen: true },
        })
    }

    const handleEditEntity = (entity: EntityUsers) => {
        dispatch({
            type: "merge",
            payload: { editingEntity: entity, isDialogOpen: true },
        })
    }

    const handleDeleteEntity = async (entity: EntityUsers) => {
        if (!(await confirm(t("confirmDelete")))) {
            return
        }

        dispatch({ type: "merge", payload: { isDeleting: true } })
        try {
            const result = await deleteEntityAction({ id: entity.id })
            const handledResult = handleSafeActionResult(result, {
                error: toast.error,
                t: tErrors,
                fallbackErrorMessage: tErrors("DeleteEntityFail"),
            })
            if (!handledResult.ok) return

            toast.success(t("dialog.success.DeleteEntitySuccess"))

            const entitiesData = await getEntitiesAction()
            dispatch({ type: "merge", payload: { entities: entitiesData } })
        } catch (error) {
            console.error(error)
            toast.error(tErrors("DeleteEntityFail"))
        } finally {
            dispatch({ type: "merge", payload: { isDeleting: false } })
        }
    }

    const handleEntityDialogClose = (newEntity?: EntityUsers) => {
        dispatch({ type: "merge", payload: { isDialogOpen: false } })

        if (newEntity) {
            getEntitiesAction().then((entitiesData) => {
                dispatch({ type: "merge", payload: { entities: entitiesData } })
            })
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-col justify-between space-y-2 pb-2">
                <div className="flex flex-row items-center justify-between space-x-2 w-full">
                    <div className="flex items-center gap-2">
                        <CardTitle>{t("entities")}</CardTitle>
                        <HoverCard>
                            <HoverCardTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    aria-label={t("rules.title")}
                                >
                                    <CircleHelp className="h-4 w-4" />
                                </Button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-96">
                                <div className="space-y-2">
                                    <p className="font-medium">{t("rules.title")}</p>
                                    <ul className="list-disc pl-4 text-sm space-y-1">
                                        <li>{t("rules.uniqueName")}</li>
                                        <li>{t("rules.onlyAssignedEntities")}</li>
                                    </ul>
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleCreateEntity}
                        disabled={
                            !canCreateEntity ||
                            (process.env.NEXT_PUBLIC_MAX_ENTITY
                                ? state.entities.length >= parseInt(process.env.NEXT_PUBLIC_MAX_ENTITY)
                                : false)
                        }
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("newEntity")}
                    </Button>
                </div>
                {process.env.NEXT_PUBLIC_MAX_ENTITY && (
                    <div className="text-sm text-muted-foreground">
                        {state.entities.length} / {process.env.NEXT_PUBLIC_MAX_ENTITY}
                    </div>
                )}
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("search")}
                        value={state.searchQuery}
                        onChange={(e) =>
                            dispatch({
                                type: "merge",
                                payload: { searchQuery: e.target.value },
                            })
                        }
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-110px)]">
                <ScrollArea className="h-full pr-4">
                    <div>
                        {filteredEntities.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("columns.name")}</TableHead>
                                        <TableHead>{t("columns.usersCount")}</TableHead>
                                        <TableHead>{t("columns.createdAt")}</TableHead>
                                        <TableHead>{t("columns.updatedAt")}</TableHead>
                                        <TableHead>{t("columns.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEntities.map((entity) => (
                                        <TableRow key={entity.id}>
                                            <TableCell>
                                                <div className="font-medium">{entity.name}</div>
                                                <Badge
                                                    variant="outline"
                                                    className="mt-1"
                                                >
                                                    {entity.id.slice(0, 8)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{t("usersCount", { count: entity.Users.length })}</TableCell>
                                            <TableCell>{new Date(entity.createdAt).toLocaleString()}</TableCell>
                                            <TableCell>{new Date(entity.updatedAt).toLocaleString()}</TableCell>
                                            <TableCell>
                                                {canEditEntity && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            className="cursor-pointer"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditEntity(entity)}
                                                            disabled={state.isDeleting}
                                                            title={tCommon("edit")}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            className="cursor-pointer"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteEntity(entity)}
                                                            disabled={state.isDeleting}
                                                            title={tCommon("delete")}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {filteredEntities.length === 0 && state.searchQuery && (
                            <div className="text-center py-4 text-muted-foreground">{t("noEntitiesFoundSearch")}</div>
                        )}
                        {state.entities.length === 0 && !state.searchQuery && (
                            <div className="text-center py-4 text-muted-foreground">{t("noEntitiesFound")}</div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            {(canCreateEntity || canEditEntity) && (
                <EntityDialog
                    open={state.isDialogOpen}
                    onOpenChange={(isDialogOpen) => dispatch({ type: "merge", payload: { isDialogOpen } })}
                    entity={state.editingEntity}
                    onClose={handleEntityDialogClose}
                />
            )}
        </Card>
    )
}

