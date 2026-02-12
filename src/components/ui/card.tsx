import * as React from "react"
import {
  Card as MuiCard,
  CardHeader as MuiCardHeader,
  CardContent as MuiCardContent,
  CardActions,
  Typography,
  type CardProps as MuiCardProps,
} from '@mui/material'

const Card = React.forwardRef<HTMLDivElement, MuiCardProps>(
  ({ ...props }, ref) => (
    <MuiCard ref={ref} {...props} />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <MuiCardHeader
    ref={ref}
    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
    title={children}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <Typography ref={ref} variant="h6" component="div" {...props}>
    {children}
  </Typography>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <Typography ref={ref} variant="body2" color="text.secondary" {...props}>
    {children}
  </Typography>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => <MuiCardContent ref={ref} {...props} />)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => (
  <CardActions ref={ref} sx={{ pt: 0 }} {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
