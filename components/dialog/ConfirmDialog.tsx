import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ReactNode } from "react"

export type ConfirmDialogProps = {
    onConfirm: () => void
    onCancel: () => void
    open: boolean
    title?: ReactNode
    description?: ReactNode
}
export function ConfirmDialog({ open, onConfirm, onCancel, title, description }: ConfirmDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title ? title : "Êtes vous sûres ?"}</AlertDialogTitle>
                    {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onCancel()}>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConfirm()}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
