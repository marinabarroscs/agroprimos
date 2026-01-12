'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function LotePublico() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lote, setLote] = useState(null)
  const [animais, setAnimais] = useState([])
  const [lancamentos, setLancamentos] = useState([])

  useEffect(() => {
    if (params.id) {
      loadLoteData(params.id)
    }
  }, [params.id])

  const loadLoteData = async (loteId) => {
    setLoading(true)
    try {
      // Carregar lote
      const { data: loteData, error: loteError } = await supabase
        .from('lotes')
        .select('*')
        .eq('id', loteId)
        .single()

      if (loteError || !loteData) {
        setError('Lote não encontrado')
        setLoading(false)
        return
      }

      // Só permite visualizar lotes fechados
      if (loteData.status !== 'fechado') {
        setError('Este lote ainda está em andamento')
        setLoading(false)
        return
      }

      setLote(loteData)

      // Carregar animais
      const { data: animaisData } = await supabase
        .from('animais')
        .select('*')
        .eq('lote_id', loteId)

      setAnimais(animaisData || [])

      // Carregar lançamentos
      const { data: lancamentosData } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('lote_id', loteId)
        .order('data', { ascending: false })

      setLancamentos(lancamentosData || [])

    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar dados')
    }
    setLoading(false)
  }

  const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const formatDate = (d) => { if (!d) return '-'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }
  
  const calcularDiasLote = (ini, fim) => { 
    if (!ini) return 0
    const i = new Date(ini)
    const f = fim ? new Date(fim) : new Date()
    return Math.floor((f - i) / (1000 * 60 * 60 * 24)) 
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">🐄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ops!</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <a href="/" className="inline-block px-6 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800">
            Ir para o início
          </a>
        </div>
      </div>
    )
  }

  // Calcular métricas
  const dias = calcularDiasLote(lote?.data_inicio, lote?.data_fim)
  const meses = (dias / 30).toFixed(1)
  const mesesNum = dias / 30

  // Totais dos lançamentos
  const totalAportes = lancamentos.filter(l => l.tipo === 'aporte').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
  const totalVendas = lancamentos.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
  const totalCustos = lancamentos.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
  const totalDespesas = lancamentos.filter(l => l.tipo === 'infraestrutura').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
  const dividendos = lancamentos.filter(l => l.tipo === 'dividendo').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
  const resultadoBruto = totalVendas - totalCustos
  const resultadoLiquido = resultadoBruto - totalDespesas
  const resultadoFinal = resultadoLiquido - dividendos

  // Rendimentos
  // Juros compostos: (((Resultado + Aportes) / Aportes) ^ (1 / Meses)) - 1
  const montanteBruto = resultadoBruto + totalAportes
  const montanteLiquido = resultadoLiquido + totalAportes
  const rendSoCustos = mesesNum > 0 && totalAportes > 0 ? (Math.pow(montanteBruto / totalAportes, 1 / mesesNum) - 1) * 100 : 0
  const rendComDespesas = mesesNum > 0 && totalAportes > 0 ? (Math.pow(montanteLiquido / totalAportes, 1 / mesesNum) - 1) * 100 : 0

  // Arrobas
  const totalArrobaCompra = animais.reduce((a, x) => a + parseFloat(x.arroba_compra || 0), 0)
  const totalArrobaVenda = animais.reduce((a, x) => a + parseFloat(x.arroba_venda || 0), 0)
  const lucroGado = animais.reduce((a, x) => a + (parseFloat(x.valor_venda || 0) - parseFloat(x.valor_compra || 0)), 0)
  const rendimentoCarcaca = totalArrobaCompra > 0 ? ((totalArrobaVenda / totalArrobaCompra) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-900 to-green-700 text-white py-6 md:py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl md:text-4xl">🐄</span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">AgroPrimos</h1>
              <p className="text-xs md:text-sm opacity-80">Agropecuária Cambui • Junqueiro - AL</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 md:p-6">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">RELATÓRIO DE LOTE</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-3">{lote?.nome}</h2>
            <p className="opacity-90 mt-1">
              {formatDate(lote?.data_inicio)} até {formatDate(lote?.data_fim)} • {dias} dias ({meses} meses)
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 -mt-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-xs text-blue-600 mb-1 font-medium">Aportes</div>
            <div className="text-lg md:text-xl font-bold text-blue-900">{formatMoney(totalAportes)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-xs text-green-600 mb-1 font-medium">Vendas</div>
            <div className="text-lg md:text-xl font-bold text-green-900">{formatMoney(totalVendas)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-xs text-red-600 mb-1 font-medium">Custos</div>
            <div className="text-lg md:text-xl font-bold text-red-900">{formatMoney(totalCustos)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-lg text-center">
            <div className="text-xs text-orange-600 mb-1 font-medium">Despesas</div>
            <div className="text-lg md:text-xl font-bold text-orange-900">{formatMoney(totalDespesas)}</div>
          </div>
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          <div className={`rounded-xl p-5 shadow-lg text-center ${resultadoBruto >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
            <div className="text-sm text-gray-600 mb-1">Resultado Bruto</div>
            <div className={`text-2xl md:text-3xl font-bold ${resultadoBruto >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {formatMoney(resultadoBruto)}
            </div>
          </div>
          <div className={`rounded-xl p-5 shadow-lg text-center ${resultadoLiquido >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-sm text-gray-600 mb-1">Resultado Líquido</div>
            <div className={`text-2xl md:text-3xl font-bold ${resultadoLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatMoney(resultadoLiquido)}
            </div>
          </div>
        </div>

        {/* Rendimento */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 md:p-6 shadow-lg mb-6 text-white">
          <h3 className="font-semibold mb-4 text-lg">📈 Rendimento dos Aportes</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-sm opacity-90 mb-1">Só Custos</div>
              <div className="text-3xl md:text-4xl font-bold">{rendSoCustos.toFixed(2)}%</div>
              <div className="text-xs opacity-80">ao mês</div>
            </div>
            <div className="text-center">
              <div className="text-sm opacity-90 mb-1">Com Despesas</div>
              <div className="text-3xl md:text-4xl font-bold">{rendComDespesas.toFixed(2)}%</div>
              <div className="text-xs opacity-80">ao mês</div>
            </div>
          </div>
        </div>

        {/* Animais */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">🐄 Animais ({animais.length})</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">@ Compra (Vivo)</div>
              <div className="text-xl font-bold">{totalArrobaCompra.toFixed(2)} @</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">@ Venda (Morto)</div>
              <div className="text-xl font-bold">{totalArrobaVenda.toFixed(2)} @</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-600 mb-1">Rend. Carcaça</div>
              <div className="text-xl font-bold text-blue-700">{rendimentoCarcaca}%</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xs text-green-600 mb-1">Lucro Gado</div>
              <div className="text-xl font-bold text-green-700">{formatMoney(lucroGado)}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-600">Animal</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600">Compra</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600">Venda</th>
                  <th className="text-right py-2 px-2 font-semibold text-gray-600">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {animais.map(a => {
                  const resultado = (parseFloat(a.valor_venda) || 0) - (parseFloat(a.valor_compra) || 0)
                  return (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div className="font-medium">{a.nome}</div>
                        <div className="text-xs text-gray-400">{a.apelido} • {a.raca}</div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div>{formatMoney(a.valor_compra)}</div>
                        <div className="text-xs text-gray-400">{a.arroba_compra}@ vivo</div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div>{formatMoney(a.valor_venda)}</div>
                        <div className="text-xs text-gray-400">{a.arroba_venda}@ morto</div>
                      </td>
                      <td className={`py-3 px-2 text-right font-semibold ${resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMoney(resultado)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3 px-2">TOTAL</td>
                  <td className="py-3 px-2 text-right">{formatMoney(animais.reduce((a, x) => a + parseFloat(x.valor_compra || 0), 0))}</td>
                  <td className="py-3 px-2 text-right">{formatMoney(animais.reduce((a, x) => a + parseFloat(x.valor_venda || 0), 0))}</td>
                  <td className={`py-3 px-2 text-right ${lucroGado >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(lucroGado)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* DRE Resumido */}
        <div className="bg-white rounded-xl p-5 md:p-6 shadow-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">💰 Demonstrativo Financeiro</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total de Vendas</span>
              <span className="font-semibold text-green-600">{formatMoney(totalVendas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">(-) Custos Operacionais</span>
              <span className="font-semibold text-red-600">-{formatMoney(totalCustos)}</span>
            </div>
            <div className={`flex justify-between py-3 ${resultadoBruto >= 0 ? 'bg-blue-50' : 'bg-red-50'} -mx-2 px-2 rounded-lg`}>
              <span className="font-semibold">= Resultado Bruto</span>
              <span className={`font-bold ${resultadoBruto >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatMoney(resultadoBruto)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">(-) Despesas (Infraestrutura)</span>
              <span className="font-semibold text-orange-600">-{formatMoney(totalDespesas)}</span>
            </div>
            <div className={`flex justify-between py-3 ${resultadoLiquido >= 0 ? 'bg-green-50' : 'bg-red-50'} -mx-2 px-2 rounded-lg`}>
              <span className="font-bold">= Resultado Líquido</span>
              <span className={`font-bold text-lg ${resultadoLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatMoney(resultadoLiquido)}</span>
            </div>
            {dividendos > 0 && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">(-) Dividendos Distribuídos</span>
                  <span className="font-semibold text-purple-600">-{formatMoney(dividendos)}</span>
                </div>
                <div className={`flex justify-between py-3 ${resultadoFinal >= 0 ? 'bg-blue-50' : 'bg-red-50'} -mx-2 px-2 rounded-lg`}>
                  <span className="font-bold">= Saldo Final</span>
                  <span className={`font-bold text-lg ${resultadoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatMoney(resultadoFinal)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Observações */}
        {lote?.observacoes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 md:p-6 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3">📝 Observações</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{lote.observacoes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-gray-400 text-sm">
          <p>Relatório gerado pelo sistema AgroPrimos</p>
          <p className="mt-1">Agropecuária Cambui • Junqueiro - AL</p>
        </div>
      </main>
    </div>
  )
}
