import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo with Serif font */}
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Passage
          </h1>
        </Link>

        {/* Sign In Button */}
        <div className="flex items-center space-x-4">
          <Link href="/signin">
            <Button variant="default" size="default">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

