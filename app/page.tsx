'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function Home() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">VectorDB SaaS</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
          {user ? (
            <div className="space-y-4">
              <p className="text-center mb-4">
                Você está logado como <strong>{user.email}</strong>
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/dashboard">
                    Acessar Painel
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setLoading(true)
                    await signOut()
                    setLoading(false)
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saindo...' : 'Sair'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center mb-4">
                Bem-vindo ao VectorDB SaaS, o sistema de banco de dados vetorial para empresas.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/login">
                    Entrar
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/signup">
                    Criar Conta
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
