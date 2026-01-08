'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Estados dos dados
  const [config, setConfig] = useState(null)
  const [socios, setSocios] = useState([])
  const [loteAtual, setLoteAtual] = useState(null)
  const [animais, setAnimais] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [pesagens, setPesagens] = useState([])
  const [caixa, setCaixa] = useState(null)
  const [sociosLote, setSociosLote] = useState([])
  const [lotes, setLotes] = useState([])
  
  // Estados dos modais
  const [showNewLancamento, setShowNewLancamento] = useState(false)
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [showNewAnimal, setShowNewAnimal] = useState(false)
  const [showAddPesagem, setShowAddPesagem] = useState(false)
  const [showFecharLote, setShowFecharLote] = useState(false)
  
  // Estado do formulário de novo lançamento
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'saida',
    categoria: '',
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    socio_id: '',
    rateio_lote: true
  })
  
  // Estado do formulário de novo animal
  const [novoAnimal, setNovoAnimal] = useState({
    nome: '',
    apelido: '',
    brinco: '',
    raca: 'Nelore',
    sexo: 'Fêmea',
    idade: '',
    cor: '',
    peso_compra: '',
    valor_compra: '',
    data_compra: new Date().toISOString().split('T')[0],
    observacoes: ''
  })
  
  // Estado do formulário de nova pesagem
  const [novaPesagem, setNovaPesagem] = useState({
    data: new Date().toISOString().split('T')[0],
    peso: '',
    observacao: ''
  })

  // Carregar dados iniciais
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const savedAuth = localStorage.getItem('agroprimos_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
      await loadAllData()
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('config')
      .select('senha_acesso')
      .single()
    
    if (data && data.senha_acesso === password) {
      localStorage.setItem('agroprimos_auth', 'true')
      setIsAuthenticated(true)
      await loadAllData()
    } else {
      alert('Senha incorreta!')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('agroprimos_auth')
    setIsAuthenticated(false)
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Carregar config
      const { data: configData } = await supabase.from('config').select('*').single()
      setConfig(configData)
      
      // Carregar sócios
      const { data: sociosData } = await supabase.from('socios').select('*').order('id')
      setSocios(sociosData || [])
      
      // Carregar lote atual
      const { data: loteData } = await supabase.from('lotes').select('*').eq('status', 'ativo').single()
      setLoteAtual(loteData)
      
      // Carregar todos os lotes
      const { data: lotesData } = await supabase.from('lotes').select('*').order('data_inicio', { ascending: false })
      setLotes(lotesData || [])
      
      // Carregar animais do lote atual
      if (loteData) {
        const { data: animaisData } = await supabase.from('animais').select('*').eq('lote_id', loteData.id)
        setAnimais(animaisData || [])
        
        // Carregar lançamentos do lote atual
        const { data: lancamentosData } = await supabase.from('lancamentos').select('*').eq('lote_id', loteData.id).order('data', { ascending: false })
        setLancamentos(lancamentosData || [])
        
        // Carregar pesagens dos animais do lote
        const animalIds = (animaisData || []).map(a => a.id)
        if (animalIds.length > 0) {
          const { data: pesagensData } = await supabase.from('pesagens').select('*').in('animal_id', animalIds).order('data', { ascending: true })
          setPesagens(pesagensData || [])
        }
      }
      
      // Carregar view de caixa
      const { data: caixaData } = await supabase.from('v_caixa_atual').select('*').single()
      setCaixa(caixaData)
      
      // Carregar view de sócios no lote
      const { data: sociosLoteData } = await supabase.from('v_socios_lote_atual').select('*')
      setSociosLote(sociosLoteData || [])
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
    setLoading(false)
  }

  // Função para salvar novo lançamento
  const handleSaveLancamento = async () => {
    if (!novoLancamento.categoria || !novoLancamento.valor || !novoLancamento.data) {
      alert('Preencha todos os campos obrigatórios!')
      return
    }
    
    let valorFinal = parseFloat(novoLancamento.valor)
    if (novoLancamento.tipo === 'saida' || novoLancamento.tipo === 'infraestrutura') {
      valorFinal = -Math.abs(valorFinal)
    }
    
    const { error } = await supabase.from('lancamentos').insert({
      lote_id: loteAtual.id,
      tipo: novoLancamento.tipo,
      categoria: novoLancamento.categoria,
      descricao: novoLancamento.descricao,
      valor: valorFinal,
      data: novoLancamento.data,
      socio_id: novoLancamento.tipo === 'aporte' ? parseInt(novoLancamento.socio_id) : null,
      rateio_lote: novoLancamento.rateio_lote
    })
    
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setShowNewLancamento(false)
      setNovoLancamento({
        tipo: 'saida',
        categoria: '',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        socio_id: '',
        rateio_lote: true
      })
      await loadAllData()
    }
  }

  // Função para salvar novo animal
  const handleSaveAnimal = async () => {
    if (!novoAnimal.nome || !novoAnimal.peso_compra || !novoAnimal.valor_compra) {
      alert('Preencha os campos obrigatórios!')
      return
    }
    
    const pesoCompra = parseFloat(novoAnimal.peso_compra)
    const arrobaCompra = (pesoCompra / 15).toFixed(2)
    
    const { data: animalData, error } = await supabase.from('animais').insert({
      lote_id: loteAtual.id,
      nome: novoAnimal.nome,
      apelido: novoAnimal.apelido,
      brinco: novoAnimal.brinco,
      raca: novoAnimal.raca,
      sexo: novoAnimal.sexo,
      idade: novoAnimal.idade,
      cor: novoAnimal.cor,
      peso_compra: pesoCompra,
      arroba_compra: arrobaCompra,
      valor_compra: parseFloat(novoAnimal.valor_compra),
      data_compra: novoAnimal.data_compra,
      peso_atual: pesoCompra,
      arroba_atual: arrobaCompra,
      observacoes: novoAnimal.observacoes,
      status: 'ativo'
    }).select().single()
    
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      // Inserir pesagem inicial
      await supabase.from('pesagens').insert({
        animal_id: animalData.id,
        data: novoAnimal.data_compra,
        peso: pesoCompra,
        arroba: arrobaCompra,
        observacao: 'Peso de entrada'
      })
      
      // Inserir lançamento de compra
      await supabase.from('lancamentos').insert({
        lote_id: loteAtual.id,
        animal_id: animalData.id,
        tipo: 'saida',
        categoria: 'compra_gado',
        descricao: novoAnimal.nome,
        valor: -parseFloat(novoAnimal.valor_compra),
        data: novoAnimal.data_compra,
        rateio_lote: false
      })
      
      setShowNewAnimal(false)
      setNovoAnimal({
        nome: '',
        apelido: '',
        brinco: '',
        raca: 'Nelore',
        sexo: 'Fêmea',
        idade: '',
        cor: '',
        peso_compra: '',
        valor_compra: '',
        data_compra: new Date().toISOString().split('T')[0],
        observacoes: ''
      })
      await loadAllData()
    }
  }

  // Função para salvar nova pesagem
  const handleSavePesagem = async () => {
    if (!novaPesagem.peso || !novaPesagem.data) {
      alert('Preencha os campos obrigatórios!')
      return
    }
    
    const peso = parseFloat(novaPesagem.peso)
    const arroba = (peso / 15).toFixed(2)
    
    // Inserir pesagem
    const { error } = await supabase.from('pesagens').insert({
      animal_id: selectedAnimal.id,
      data: novaPesagem.data,
      peso: peso,
      arroba: arroba,
      observacao: novaPesagem.observacao
    })
    
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      // Atualizar peso atual do animal
      await supabase.from('animais').update({
        peso_atual: peso,
        arroba_atual: arroba
      }).eq('id', selectedAnimal.id)
      
      setShowAddPesagem(false)
      setNovaPesagem({
        data: new Date().toISOString().split('T')[0],
        peso: '',
        observacao: ''
      })
      await loadAllData()
      
      // Atualizar animal selecionado
      const { data: updatedAnimal } = await supabase.from('animais').select('*').eq('id', selectedAnimal.id).single()
      setSelectedAnimal(updatedAnimal)
    }
  }

  // Função para registrar venda do animal
  const handleVendaAnimal = async (animalId, pesoVenda, valorVenda, dataVenda) => {
    const peso = parseFloat(pesoVenda)
    const arroba = (peso / 15).toFixed(2)
    
    // Atualizar animal
    await supabase.from('animais').update({
      peso_venda: peso,
      arroba_venda: arroba,
      valor_venda: parseFloat(valorVenda),
      data_venda: dataVenda,
      status: 'vendido'
    }).eq('id', animalId)
    
    // Inserir pesagem final
    await supabase.from('pesagens').insert({
      animal_id: animalId,
      data: dataVenda,
      peso: peso,
      arroba: arroba,
      observacao: 'Peso de venda'
    })
    
    // Inserir lançamento de venda
    const animal = animais.find(a => a.id === animalId)
    await supabase.from('lancamentos').insert({
      lote_id: loteAtual.id,
      animal_id: animalId,
      tipo: 'entrada',
      categoria: 'venda_gado',
      descricao: animal?.nome || 'Venda de animal',
      valor: parseFloat(valorVenda),
      data: dataVenda,
      rateio_lote: false
    })
    
    await loadAllData()
    setShowAnimalModal(false)
  }

  // Calcular indicadores
  const calcularIndicadores = () => {
    if (!caixa) return {}
    
    const totalAportes = parseFloat(caixa.total_aportes) || 0
    const totalEntradas = parseFloat(caixa.total_entradas) || 0
    const totalSaidas = Math.abs(parseFloat(caixa.total_saidas)) || 0
    const totalInfra = Math.abs(parseFloat(caixa.total_infraestrutura)) || 0
    const caixaAtual = parseFloat(caixa.caixa_atual) || 0
    
    const custoTotal = totalSaidas
    const patrimonioGado = animais.filter(a => a.status === 'ativo').reduce((acc, a) => acc + parseFloat(a.valor_compra || 0), 0)
    
    return {
      totalAportes,
      totalEntradas,
      custoTotal,
      totalInfra,
      caixaAtual,
      patrimonioGado,
      animaisAtivos: animais.filter(a => a.status === 'ativo').length
    }
  }
  
  const indicadores = calcularIndicadores()

  // Formatar moeda
  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
  }

  // Formatar data
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
  }

  // Calcular dias do lote
  const calcularDiasLote = () => {
    if (!loteAtual?.data_inicio) return 0
    const inicio = new Date(loteAtual.data_inicio)
    const hoje = new Date()
    const diff = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24))
    return diff
  }

  // Obter pesagens do animal
  const getPesagensAnimal = (animalId) => {
    return pesagens.filter(p => p.animal_id === animalId).sort((a, b) => new Date(a.data) - new Date(b.data))
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center p-5">
        <div className="bg-white/95 rounded-3xl p-12 w-full max-w-md shadow-2xl text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-700 to-green-900 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">
            🐄
          </div>
          <h1 className="text-3xl font-extrabold text-green-900 mb-2">AgroPrimos</h1>
          <p className="text-gray-500 mb-8 text-sm">Gestão de Gado da Família</p>
          
          <input
            type="password"
            placeholder="Digite a senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full p-4 text-base border-2 border-gray-200 rounded-xl outline-none mb-4 focus:border-green-600 transition-colors"
          />
          
          <button
            onClick={handleLogin}
            className="w-full p-4 text-base font-semibold text-white bg-gradient-to-r from-green-700 to-green-900 rounded-xl hover:opacity-90 transition-opacity"
          >
            Entrar
          </button>
          
          <p className="mt-6 text-xs text-gray-400">
            Agropecuária Cambui • Junqueiro - AL
          </p>
        </div>
      </div>
    )
  }

  // Componente Card
  const Card = ({ title, value, subtitle, icon, large = false, color = 'white' }) => (
    <div className={`rounded-2xl p-5 shadow-lg ${large ? 'bg-gradient-to-br from-green-900 to-green-700 text-white' : 'bg-white'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className={large ? 'text-3xl' : 'text-xl'}>{icon}</span>
        <span className={`text-xs font-medium uppercase tracking-wide ${large ? 'opacity-90' : 'opacity-60'}`}>{title}</span>
      </div>
      <div className={`font-bold ${large ? 'text-3xl' : 'text-2xl'}`}>{value}</div>
      {subtitle && <div className={`text-sm mt-1 ${large ? 'opacity-80' : 'opacity-60'}`}>{subtitle}</div>}
    </div>
  )

  // Navegação
  const NavItem = ({ page, icon, label }) => (
    <button
      onClick={() => { setCurrentPage(page); setMobileMenuOpen(false) }}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${
        currentPage === page 
          ? 'bg-green-100 text-green-900 font-semibold' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  )

  // Renderizar conteúdo
  const renderContent = () => {
    switch(currentPage) {
      case 'dashboard':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">Dashboard</h2>
            
            <div className="mb-6">
              <Card 
                title="Caixa Atual" 
                value={formatMoney(indicadores.caixaAtual)}
                subtitle="Disponível para operações"
                icon="💰"
                large={true}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <Card title="Total Aportes" value={formatMoney(indicadores.totalAportes)} icon="📥" />
              <Card title="Custos" value={formatMoney(indicadores.custoTotal)} subtitle="Gastos com o gado" icon="💸" />
              <Card title="Infraestrutura" value={formatMoney(indicadores.totalInfra)} subtitle="Investido no período" icon="🔧" />
              <Card title="Patrimônio em Gado" value={formatMoney(indicadores.patrimonioGado)} icon="🐄" />
              <Card title="Animais Ativos" value={indicadores.animaisAtivos} subtitle="No lote atual" icon="📊" />
            </div>
            
            {loteAtual && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4">📅 Lote Atual: {loteAtual.nome}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Início</div>
                    <div className="font-semibold">{formatDate(loteAtual.data_inicio)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Dias</div>
                    <div className="font-semibold">{calcularDiasLote()} dias</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Animais</div>
                    <div className="font-semibold">{indicadores.animaisAtivos} cabeças</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Status</div>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Ativo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'lancamentos':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">Lançamentos</h2>
              <button
                onClick={() => setShowNewLancamento(true)}
                className="px-6 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors"
              >
                + Novo Lançamento
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {lancamentos.map((item, idx) => (
                <div key={item.id} className={`p-4 flex justify-between items-center ${idx < lancamentos.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      item.tipo === 'entrada' || item.tipo === 'aporte' ? 'bg-green-100' : 
                      item.tipo === 'infraestrutura' ? 'bg-orange-100' : 'bg-red-100'
                    }`}>
                      {item.tipo === 'entrada' || item.tipo === 'aporte' ? '📥' : item.tipo === 'infraestrutura' ? '🔧' : '📤'}
                    </div>
                    <div>
                      <div className="font-medium">{item.descricao || item.categoria}</div>
                      <div className="text-sm text-gray-400">{item.categoria} • {formatDate(item.data)}</div>
                    </div>
                  </div>
                  <div className={`font-semibold ${item.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.valor >= 0 ? '+' : ''}{formatMoney(item.valor)}
                  </div>
                </div>
              ))}
              {lancamentos.length === 0 && (
                <div className="p-8 text-center text-gray-400">Nenhum lançamento registrado</div>
              )}
            </div>
          </div>
        )

      case 'animais':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">Animais do Lote</h2>
              <button
                onClick={() => setShowNewAnimal(true)}
                className="px-6 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors"
              >
                + Novo Animal
              </button>
            </div>
            
            <div className="space-y-4">
              {animais.map(animal => {
                const ganhoPeso = (parseFloat(animal.peso_atual) || 0) - (parseFloat(animal.peso_compra) || 0)
                const ganhoArroba = (parseFloat(animal.arroba_atual) || 0) - (parseFloat(animal.arroba_compra) || 0)
                const animalPesagens = getPesagensAnimal(animal.id)
                
                return (
                  <div 
                    key={animal.id} 
                    onClick={() => { setSelectedAnimal(animal); setShowAnimalModal(true) }}
                    className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-600 flex items-center justify-center text-3xl">
                          🐄
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Brinco: {animal.brinco || '-'}</div>
                          <h3 className="text-lg font-semibold">{animal.nome}</h3>
                          <p className="text-gray-500 text-sm">"{animal.apelido}" • {animal.raca} • {animal.sexo}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        animal.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {animal.status === 'ativo' ? 'Ativo' : 'Vendido'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Peso Inicial</div>
                        <div className="font-semibold">{animal.peso_compra} kg</div>
                        <div className="text-xs text-gray-500">{animal.arroba_compra} @</div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-blue-600 mb-1">Peso Atual</div>
                        <div className="font-semibold text-blue-700">{animal.peso_atual} kg</div>
                        <div className="text-xs text-blue-500">{animal.arroba_atual} @</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-green-600 mb-1">Ganho</div>
                        <div className="font-semibold text-green-700">+{ganhoPeso.toFixed(1)} kg</div>
                        <div className="text-xs text-green-500">+{ganhoArroba.toFixed(2)} @</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Valor Compra</div>
                        <div className="font-semibold">{formatMoney(animal.valor_compra)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Custo por @</div>
                        <div className="font-semibold">{formatMoney(animal.valor_compra / animal.arroba_compra)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        📅 Comprado em {formatDate(animal.data_compra)} • ⚖️ {animalPesagens.length} pesagens
                      </div>
                      <span className="text-sm text-green-700 font-medium">Clique para ver ficha completa →</span>
                    </div>
                  </div>
                )
              })}
              {animais.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Nenhum animal cadastrado</div>
              )}
            </div>
          </div>
        )

      case 'socios':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">Sócios e Participações</h2>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="grid grid-cols-5 p-4 bg-gray-50 font-semibold text-sm text-gray-500">
                <div>SÓCIO</div>
                <div className="text-center">PARTICIPAÇÃO</div>
                <div className="text-right">APORTE INICIAL</div>
                <div className="text-right">APORTES ATUAIS</div>
                <div className="text-right">SALDO</div>
              </div>
              
              {sociosLote.map((socio, idx) => (
                <div key={socio.socio_id} className={`grid grid-cols-5 p-4 items-center ${idx < sociosLote.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                      style={{ backgroundColor: `hsl(${idx * 60}, 70%, 85%)` }}
                    >
                      {socio.nome[0]}
                    </div>
                    <span className="font-medium">{socio.nome}</span>
                  </div>
                  <div className="text-center">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {(parseFloat(socio.participacao) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-right font-medium text-gray-600">
                    {formatMoney(socio.aporte_inicial)}
                  </div>
                  <div className="text-right font-medium text-green-600">
                    {formatMoney(socio.aportes_atuais)}
                  </div>
                  <div className="text-right font-semibold text-green-900">
                    {formatMoney(socio.total_aportes)}
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-5 p-4 bg-green-900 text-white font-semibold">
                <div>TOTAL</div>
                <div className="text-center">100%</div>
                <div className="text-right">{formatMoney(sociosLote.reduce((acc, s) => acc + parseFloat(s.aporte_inicial || 0), 0))}</div>
                <div className="text-right">{formatMoney(sociosLote.reduce((acc, s) => acc + parseFloat(s.aportes_atuais || 0), 0))}</div>
                <div className="text-right">{formatMoney(sociosLote.reduce((acc, s) => acc + parseFloat(s.total_aportes || 0), 0))}</div>
              </div>
            </div>
            
            <div className="mt-5 p-4 bg-gray-50 rounded-xl flex flex-wrap gap-6 text-sm text-gray-600">
              <div><strong className="text-gray-500">Aporte Inicial:</strong> Valor transferido do lote anterior</div>
              <div><strong className="text-green-600">Aportes Atuais:</strong> Novos aportes durante o lote</div>
              <div><strong className="text-green-900">Saldo:</strong> Soma dos aportes</div>
            </div>
          </div>
        )

      case 'indicadores':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">Indicadores do Lote</h2>
            
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-base font-semibold text-gray-500 mb-5">🐄 INDICADORES DE GADO</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Média Arrobas/Animal</div>
                    <div className="text-2xl font-bold">
                      {animais.length > 0 
                        ? (animais.reduce((acc, a) => acc + parseFloat(a.arroba_atual || 0), 0) / animais.length).toFixed(2)
                        : '0'} @
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Valor @ Compra (média)</div>
                    <div className="text-2xl font-bold">
                      {animais.length > 0 
                        ? formatMoney(animais.reduce((acc, a) => acc + (parseFloat(a.valor_compra || 0) / parseFloat(a.arroba_compra || 1)), 0) / animais.length)
                        : formatMoney(0)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Valor @ Venda</div>
                    <div className="text-2xl font-bold">{formatMoney(330)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Margem por @</div>
                    <div className="text-2xl font-bold text-green-600">{formatMoney(39.45)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-base font-semibold text-gray-500 mb-5">💰 INDICADORES FINANCEIROS</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="text-xs text-red-600 mb-1">Custos Totais</div>
                    <div className="text-2xl font-bold text-red-600">{formatMoney(indicadores.custoTotal)}</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="text-xs text-orange-600 mb-1">Infraestrutura</div>
                    <div className="text-2xl font-bold text-orange-600">{formatMoney(indicadores.totalInfra)}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-xs text-green-600 mb-1">Caixa Atual</div>
                    <div className="text-2xl font-bold text-green-600">{formatMoney(indicadores.caixaAtual)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">Rendimento a.m.</div>
                    <div className="text-2xl font-bold">0.00%</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-700 mb-4">📚 Entenda: Custo vs Despesa</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-900 text-sm mb-2">CUSTO (direto do gado)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Gastos diretamente ligados à produção: compra do gado, ração, medicamentos, frete de compra/venda, vacinas.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700 text-sm mb-2">DESPESA (operacional)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Gastos operacionais não ligados diretamente ao gado: infraestrutura, manutenção de cercas, ferramentas, combustível.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'lotes':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">Gestão de Lotes</h2>
            
            {loteAtual && (
              <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-3xl p-7 mb-6 text-white">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">LOTE ATIVO</span>
                    <h3 className="text-2xl font-bold mt-3">{loteAtual.nome}</h3>
                    <p className="opacity-80">Iniciado em {formatDate(loteAtual.data_inicio)} • {calcularDiasLote()} dias</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-80 mb-1">Caixa Atual</div>
                    <div className="text-3xl font-bold">{formatMoney(indicadores.caixaAtual)}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 p-5 bg-white/10 rounded-xl mb-5">
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Animais</div>
                    <div className="text-xl font-bold">{animais.length}</div>
                    <div className="text-xs opacity-70">{animais.filter(a => a.status === 'ativo').length} ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Aportes</div>
                    <div className="text-xl font-bold">{formatMoney(indicadores.totalAportes)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Custos</div>
                    <div className="text-xl font-bold">{formatMoney(indicadores.custoTotal)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">Resultado Est.</div>
                    <div className={`text-xl font-bold ${indicadores.caixaAtual >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {indicadores.caixaAtual >= 0 ? '+' : ''}{formatMoney(indicadores.caixaAtual)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowFecharLote(true)}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  🔒 Fechar Lote e Calcular Resultado
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-500 mb-4">📚 Histórico de Lotes Fechados</h3>
            
            <div className="space-y-4">
              {lotes.filter(l => l.status === 'fechado').map(lote => (
                <div key={lote.id} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{lote.nome}</h3>
                    <span className="bg-gray-100 text-gray-600 px-4 py-1 rounded-full text-sm font-medium">Fechado</span>
                  </div>
                  <div className="grid grid-cols-4 gap-5">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Período</div>
                      <div className="font-medium">{formatDate(lote.data_inicio)} - {formatDate(lote.data_fim)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Resultado</div>
                      <div className="font-semibold text-green-600">{formatMoney(0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Rendimento a.m.</div>
                      <div className="font-semibold text-green-900">0.00%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Ação</div>
                      <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors">Ver detalhes</button>
                    </div>
                  </div>
                </div>
              ))}
              {lotes.filter(l => l.status === 'fechado').length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Nenhum lote fechado ainda</div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden text-2xl"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          <span className="text-3xl">🐄</span>
          <h1 className="text-xl font-bold text-green-900">AgroPrimos</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Sair
        </button>
      </header>
      
      <div className="flex">
        {/* Navegação */}
        <nav className={`
          ${mobileMenuOpen ? 'block' : 'hidden'} md:block
          w-64 bg-white border-r border-gray-200 p-4 min-h-[calc(100vh-65px)] 
          fixed md:sticky top-[65px] left-0 z-40
        `}>
          <NavItem page="dashboard" icon="📊" label="Dashboard" />
          <NavItem page="lancamentos" icon="💳" label="Lançamentos" />
          <NavItem page="animais" icon="🐄" label="Animais" />
          <NavItem page="socios" icon="👥" label="Sócios" />
          <NavItem page="indicadores" icon="📈" label="Indicadores" />
          <NavItem page="lotes" icon="📅" label="Gestão de Lotes" />
        </nav>
        
        {/* Conteúdo */}
        <main className="flex-1 p-8 max-w-6xl">
          {renderContent()}
        </main>
      </div>
      
      {/* Modal Novo Lançamento */}
      {showNewLancamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-6">Novo Lançamento</h3>
            
            <div className="mb-5">
              <label className="block mb-2 font-medium text-sm">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {['saida', 'aporte', 'infraestrutura', 'entrada'].map(tipo => (
                  <button 
                    key={tipo}
                    onClick={() => setNovoLancamento({...novoLancamento, tipo})}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      novoLancamento.tipo === tipo 
                        ? 'border-green-600 bg-green-50 text-green-700' 
                        : 'border-gray-200'
                    }`}
                  >
                    {tipo === 'saida' ? 'Saída' : tipo === 'aporte' ? 'Aporte' : tipo === 'infraestrutura' ? 'Infraestrutura' : 'Entrada'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-5">
              <label className="block mb-2 font-medium text-sm">Categoria</label>
              <select 
                value={novoLancamento.categoria}
                onChange={(e) => setNovoLancamento({...novoLancamento, categoria: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-xl"
              >
                <option value="">Selecione...</option>
                {novoLancamento.tipo === 'saida' && (
                  <>
                    <option value="compra_gado">Compra Gado</option>
                    <option value="racao">Ração</option>
                    <option value="medicamento">Medicamento</option>
                    <option value="frete">Frete</option>
                    <option value="outros">Outros</option>
                  </>
                )}
                {novoLancamento.tipo === 'entrada' && (
                  <>
                    <option value="venda_gado">Venda Gado</option>
                    <option value="outros">Outros</option>
                  </>
                )}
                {novoLancamento.tipo === 'aporte' && (
                  <option value="aporte">Aporte</option>
                )}
                {novoLancamento.tipo === 'infraestrutura' && (
                  <option value="infraestrutura">Infraestrutura</option>
                )}
              </select>
            </div>
            
            {novoLancamento.tipo === 'aporte' && (
              <div className="mb-5">
                <label className="block mb-2 font-medium text-sm">Sócio</label>
                <select 
                  value={novoLancamento.socio_id}
                  onChange={(e) => setNovoLancamento({...novoLancamento, socio_id: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl"
                >
                  <option value="">Selecione o sócio...</option>
                  {socios.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="mb-5">
              <label className="block mb-2 font-medium text-sm">Descrição</label>
              <input 
                type="text"
                value={novoLancamento.descricao}
                onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})}
                placeholder="Ex: 5 sacos de ração"
                className="w-full p-3 border-2 border-gray-200 rounded-xl"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block mb-2 font-medium text-sm">Valor (R$)</label>
                <input 
                  type="number"
                  value={novoLancamento.valor}
                  onChange={(e) => setNovoLancamento({...novoLancamento, valor: e.target.value})}
                  placeholder="0,00"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium text-sm">Data</label>
                <input 
                  type="date"
                  value={novoLancamento.data}
                  onChange={(e) => setNovoLancamento({...novoLancamento, data: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowNewLancamento(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveLancamento}
                className="flex-1 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Novo Animal */}
      {showNewAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">🐄 Cadastrar Novo Animal</h2>
              <button onClick={() => setShowNewAnimal(false)} className="w-9 h-9 bg-gray-100 rounded-full text-lg">✕</button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Nome/Identificação *</label>
                  <input 
                    type="text"
                    value={novoAnimal.nome}
                    onChange={(e) => setNovoAnimal({...novoAnimal, nome: e.target.value})}
                    placeholder="Ex: Novilha 3"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Apelido</label>
                  <input 
                    type="text"
                    value={novoAnimal.apelido}
                    onChange={(e) => setNovoAnimal({...novoAnimal, apelido: e.target.value})}
                    placeholder="Ex: Pintada"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Nº do Brinco</label>
                  <input 
                    type="text"
                    value={novoAnimal.brinco}
                    onChange={(e) => setNovoAnimal({...novoAnimal, brinco: e.target.value})}
                    placeholder="Ex: NV-003"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Raça</label>
                  <select 
                    value={novoAnimal.raca}
                    onChange={(e) => setNovoAnimal({...novoAnimal, raca: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  >
                    <option>Nelore</option>
                    <option>Angus</option>
                    <option>Brahman</option>
                    <option>Gir</option>
                    <option>Mestiço</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Sexo</label>
                  <select 
                    value={novoAnimal.sexo}
                    onChange={(e) => setNovoAnimal({...novoAnimal, sexo: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  >
                    <option>Fêmea</option>
                    <option>Macho</option>
                    <option>Macho Castrado</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Idade Aproximada</label>
                  <input 
                    type="text"
                    value={novoAnimal.idade}
                    onChange={(e) => setNovoAnimal({...novoAnimal, idade: e.target.value})}
                    placeholder="Ex: 18 meses"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Cor/Pelagem</label>
                  <input 
                    type="text"
                    value={novoAnimal.cor}
                    onChange={(e) => setNovoAnimal({...novoAnimal, cor: e.target.value})}
                    placeholder="Ex: Branca"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Data da Compra *</label>
                  <input 
                    type="date"
                    value={novoAnimal.data_compra}
                    onChange={(e) => setNovoAnimal({...novoAnimal, data_compra: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-5 mb-4">
                <h4 className="font-semibold text-green-900 text-sm mb-4">⚖️ Peso e Valor de Compra</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium">Peso (kg) *</label>
                    <input 
                      type="number"
                      value={novoAnimal.peso_compra}
                      onChange={(e) => setNovoAnimal({...novoAnimal, peso_compra: e.target.value})}
                      placeholder="Ex: 155"
                      className="w-full p-3 border-2 border-green-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Arrobas</label>
                    <input 
                      type="text"
                      value={novoAnimal.peso_compra ? (parseFloat(novoAnimal.peso_compra) / 15).toFixed(2) + ' @' : ''}
                      disabled
                      className="w-full p-3 border-2 border-green-200 rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Valor (R$) *</label>
                    <input 
                      type="number"
                      value={novoAnimal.valor_compra}
                      onChange={(e) => setNovoAnimal({...novoAnimal, valor_compra: e.target.value})}
                      placeholder="Ex: 3000"
                      className="w-full p-3 border-2 border-green-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block mb-1 text-sm font-medium">Observações</label>
                <textarea 
                  value={novoAnimal.observacoes}
                  onChange={(e) => setNovoAnimal({...novoAnimal, observacoes: e.target.value})}
                  placeholder="Características, condição física, etc..."
                  rows={3}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg resize-none"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowNewAnimal(false)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAnimal}
                  className="flex-1 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors"
                >
                  Salvar Animal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Ficha do Animal */}
      {showAnimalModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-green-900 to-green-700 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl border-2 border-dashed border-white/40">
                    🐄
                  </div>
                  <div>
                    <div className="text-sm opacity-80">Brinco: {selectedAnimal.brinco || '-'}</div>
                    <h2 className="text-2xl font-bold">{selectedAnimal.nome}</h2>
                    <p className="opacity-90">"{selectedAnimal.apelido}" • {selectedAnimal.raca} • {selectedAnimal.sexo}</p>
                  </div>
                </div>
                <button onClick={() => setShowAnimalModal(false)} className="w-10 h-10 bg-white/20 rounded-full text-xl">✕</button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Indicadores principais */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="text-xs text-green-600 mb-1 font-medium">PESO INICIAL</div>
                  <div className="text-2xl font-bold text-green-900">{selectedAnimal.peso_compra} kg</div>
                  <div className="text-sm text-gray-500">{selectedAnimal.arroba_compra} @</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <div className="text-xs text-blue-600 mb-1 font-medium">PESO ATUAL</div>
                  <div className="text-2xl font-bold text-blue-900">{selectedAnimal.peso_atual} kg</div>
                  <div className="text-sm text-blue-500">{selectedAnimal.arroba_atual} @</div>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                  <div className="text-xs text-orange-600 mb-1 font-medium">GANHO DE PESO</div>
                  <div className="text-2xl font-bold text-orange-600">
                    +{((parseFloat(selectedAnimal.peso_atual) || 0) - (parseFloat(selectedAnimal.peso_compra) || 0)).toFixed(1)} kg
                  </div>
                  <div className="text-sm text-orange-500">
                    +{((parseFloat(selectedAnimal.arroba_atual) || 0) - (parseFloat(selectedAnimal.arroba_compra) || 0)).toFixed(2)} @
                  </div>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <div className="text-xs text-purple-600 mb-1 font-medium">GMD</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(() => {
                      const ganhoPeso = (parseFloat(selectedAnimal.peso_atual) || 0) - (parseFloat(selectedAnimal.peso_compra) || 0)
                      const dias = calcularDiasLote()
                      return dias > 0 ? (ganhoPeso / dias).toFixed(3) : '0.000'
                    })()}
                  </div>
                  <div className="text-sm text-gray-500">kg/dia</div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Informações do Animal */}
                <div>
                  <h3 className="font-semibold text-green-900 mb-4">📋 Informações do Animal</h3>
                  <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                    {[
                      { label: 'Brinco', value: selectedAnimal.brinco || '-' },
                      { label: 'Raça', value: selectedAnimal.raca },
                      { label: 'Sexo', value: selectedAnimal.sexo },
                      { label: 'Idade', value: selectedAnimal.idade || '-' },
                      { label: 'Cor/Pelagem', value: selectedAnimal.cor || '-' },
                      { label: 'Data Compra', value: formatDate(selectedAnimal.data_compra) },
                      { label: 'Valor Compra', value: formatMoney(selectedAnimal.valor_compra) },
                      { label: 'Custo por @', value: formatMoney(selectedAnimal.valor_compra / selectedAnimal.arroba_compra) },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-sm text-gray-500">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                    {selectedAnimal.observacoes && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">Observações:</div>
                        <div className="text-sm">{selectedAnimal.observacoes}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Histórico de Pesagens */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-green-900">⚖️ Histórico de Pesagens</h3>
                    <button 
                      onClick={() => setShowAddPesagem(true)}
                      className="px-4 py-2 bg-green-900 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
                    >
                      + Nova Pesagem
                    </button>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-4 p-3 bg-gray-50 text-xs font-semibold text-gray-500">
                      <div>DATA</div>
                      <div>PESO</div>
                      <div>ARROBA</div>
                      <div>OBS</div>
                    </div>
                    {getPesagensAnimal(selectedAnimal.id).map((p, idx) => (
                      <div key={idx} className="grid grid-cols-4 p-3 border-t border-gray-100 text-sm">
                        <div>{formatDate(p.data)}</div>
                        <div className="font-semibold">{p.peso} kg</div>
                        <div>{p.arroba} @</div>
                        <div className="text-gray-500 truncate">{p.observacao}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Seção de Venda */}
              {selectedAnimal.status === 'ativo' && (
                <div className="mt-6 p-5 bg-yellow-50 rounded-xl border-2 border-dashed border-yellow-400">
                  <h4 className="font-semibold text-yellow-700 mb-4">🏷️ Registrar Venda</h4>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const form = e.target
                    handleVendaAnimal(
                      selectedAnimal.id,
                      form.pesoVenda.value,
                      form.valorVenda.value,
                      form.dataVenda.value
                    )
                  }} className="flex flex-wrap gap-3">
                    <input name="pesoVenda" type="number" placeholder="Peso final (kg)" required className="p-3 border border-gray-200 rounded-lg w-36" />
                    <input name="valorVenda" type="number" placeholder="Valor venda (R$)" required className="p-3 border border-gray-200 rounded-lg w-40" />
                    <input name="dataVenda" type="date" required className="p-3 border border-gray-200 rounded-lg" />
                    <button type="submit" className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                      Registrar Venda
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Nova Pesagem */}
      {showAddPesagem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">⚖️ Registrar Nova Pesagem</h3>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Data</label>
              <input 
                type="date"
                value={novaPesagem.data}
                onChange={(e) => setNovaPesagem({...novaPesagem, data: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-lg"
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Peso (kg)</label>
              <input 
                type="number"
                value={novaPesagem.peso}
                onChange={(e) => setNovaPesagem({...novaPesagem, peso: e.target.value})}
                placeholder="Ex: 175"
                className="w-full p-3 border-2 border-gray-200 rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-1">
                = {novaPesagem.peso ? (parseFloat(novaPesagem.peso) / 15).toFixed(2) : '0.00'} arrobas
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium">Observação</label>
              <input 
                type="text"
                value={novaPesagem.observacao}
                onChange={(e) => setNovaPesagem({...novaPesagem, observacao: e.target.value})}
                placeholder="Ex: Pesagem mensal"
                className="w-full p-3 border-2 border-gray-200 rounded-lg"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAddPesagem(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePesagem}
                className="flex-1 py-3 bg-green-900 text-white rounded-xl font-semibold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
