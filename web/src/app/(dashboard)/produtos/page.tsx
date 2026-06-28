'use client'

import { useState } from 'react'
import { Plus, Package, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export default function ProdutosPage() {
  const { toasts, success, error } = useToast()
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editPreco, setEditPreco] = useState('')

  const [newNome, setNewNome] = useState('')
  const [newPreco, setNewPreco] = useState('')
  const [newCategoria, setNewCategoria] = useState('')
  const [newCatNome, setNewCatNome] = useState('')

  const utils = trpc.useUtils()
  const { data: products, isLoading } = trpc.product.list.useQuery(
    categoryFilter ? { categoria_id: categoryFilter, status: 'ATIVO' } : { status: 'ATIVO' }
  )
  const { data: categories } = trpc.product.categoryList.useQuery()

  const invalidate = () => { utils.product.list.invalidate(); utils.product.categoryList.invalidate() }

  const createMutation = trpc.product.create.useMutation({
    onSuccess: () => { success('Produto criado!'); setShowProductForm(false); setNewNome(''); setNewPreco(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => { success('Produto atualizado!'); setEditingProduct(null); invalidate() },
    onError: (e) => error(e.message),
  })
  const createCatMutation = trpc.product.categoryCreate.useMutation({
    onSuccess: () => { success('Categoria criada!'); setShowCategoryForm(false); setNewCatNome(''); invalidate() },
    onError: (e) => error(e.message),
  })

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Produtos"
        description="Cardápio do bar"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setShowCategoryForm(true)}>
              <Plus size={16} className="mr-2" /> Categoria
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowProductForm(true)}>
              <Plus size={16} className="mr-2" /> Produto
            </Button>
          </div>
        }
      />

      {showCategoryForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Nova Categoria</h3>
            <button onClick={() => setShowCategoryForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); createCatMutation.mutate({ nome: newCatNome }) }} className="flex gap-3">
            <Input value={newCatNome} onChange={(e) => setNewCatNome(e.target.value)}
              placeholder="Nome da categoria" className="border-zinc-700 bg-zinc-800 text-white" required />
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createCatMutation.isPending}>Criar</Button>
          </form>
        </div>
      )}

      {showProductForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Novo Produto</h3>
            <button onClick={() => setShowProductForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (!newCategoria) { error('Selecione uma categoria'); return }
            createMutation.mutate({ nome: newNome, preco: Number(newPreco), categoria_id: newCategoria })
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-zinc-400">Nome *</Label>
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)}
                placeholder="Ex: Heineken 600ml" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
            </div>
            <div>
              <Label className="text-zinc-400">Preço (R$) *</Label>
              <Input type="number" step="0.01" value={newPreco} onChange={(e) => setNewPreco(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
            </div>
            <div>
              <Label className="text-zinc-400">Categoria *</Label>
              <select value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" required>
                <option value="">Selecione...</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowProductForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>Criar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm"
          className={`text-xs ${categoryFilter === '' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          onClick={() => setCategoryFilter('')}>Todos</Button>
        {categories?.map((c) => (
          <Button key={c.id} variant="ghost" size="sm"
            className={`text-xs ${categoryFilter === c.id ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => setCategoryFilter(c.id)}>{c.nome}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />)}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Package size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              {editingProduct === p.id ? (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate({ id: p.id, nome: editNome, preco: Number(editPreco) })
                }} className="space-y-2">
                  <Input value={editNome} onChange={(e) => setEditNome(e.target.value)}
                    className="border-zinc-700 bg-zinc-800 text-white" required />
                  <Input type="number" step="0.01" value={editPreco} onChange={(e) => setEditPreco(e.target.value)}
                    className="border-zinc-700 bg-zinc-800 text-white" required />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-emerald-600" disabled={updateMutation.isPending}>Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" className="text-zinc-400" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">{p.nome}</h3>
                    <button onClick={() => { setEditingProduct(p.id); setEditNome(p.nome); setEditPreco(String(Number(p.preco))) }}
                      className="text-zinc-600 hover:text-zinc-400">
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className="bg-zinc-500/10 text-zinc-400">{p.categoria.nome}</Badge>
                    <span className="text-sm font-medium text-emerald-400">R$ {Number(p.preco).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
