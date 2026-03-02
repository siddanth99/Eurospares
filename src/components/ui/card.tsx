import { ReactNode, forwardRef, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', padding = 'md', ...props }, ref) => {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
      none: '',
    }
    
    return (
      <div
        ref={ref}
        className={`rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800 ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`${className || ''}`} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardContent }

