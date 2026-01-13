'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [socios, setSocios] = useState([])
  const [loteAtual, setLoteAtual] = useState(null)
  const [animais, setAnimais] = useState([])
  const [lancamentos, setLancamentos] = useState([])
  const [todosLancamentos, setTodosLancamentos] = useState([])
  const [pesagens, setPesagens] = useState([])
  const [caixa, setCaixa] = useState(null)
  const [sociosLote, setSociosLote] = useState([])
  const [lotes, setLotes] = useState([])
  
  const [showNewLancamento, setShowNewLancamento] = useState(false)
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [showNewAnimal, setShowNewAnimal] = useState(false)
  const [showAddPesagem, setShowAddPesagem] = useState(false)
  const [showFecharLote, setShowFecharLote] = useState(false)
  const [showLoteDetalhes, setShowLoteDetalhes] = useState(false)
  const [selectedLote, setSelectedLote] = useState(null)
  const [showNovoLote, setShowNovoLote] = useState(false)
  const [showEditarLote, setShowEditarLote] = useState(false)
  
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'saida', categoria: '', subcategoria: '', descricao: '', valor: '',
    data: new Date().toISOString().split('T')[0], socio_id: '', rateio_lote: true
  })
  
  const [editandoLancamento, setEditandoLancamento] = useState(null)
  const [showEditLancamento, setShowEditLancamento] = useState(false)
  const [editandoPesagem, setEditandoPesagem] = useState(null)
  const [showEditPesagem, setShowEditPesagem] = useState(false)
  const [editandoVenda, setEditandoVenda] = useState(null)
  const [showEditVenda, setShowEditVenda] = useState(false)
  const [showEditAnimal, setShowEditAnimal] = useState(false)
  const [editandoAnimal, setEditandoAnimal] = useState(null)
  
  // Filtros de lançamentos
  const [filtroData, setFiltroData] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  
  const [novoAnimal, setNovoAnimal] = useState({
    nome: '', apelido: '', brinco: '', raca: 'Nelore', sexo: 'Fêmea',
    idade: '', cor: '', arroba_compra: '', valor_compra: '',
    data_compra: new Date().toISOString().split('T')[0], observacoes: ''
  })
  
  const [novaPesagem, setNovaPesagem] = useState({
    data: new Date().toISOString().split('T')[0], arroba: '', observacao: ''
  })
  
  const [observacoesFechamento, setObservacoesFechamento] = useState('')
  const [dataFechamento, setDataFechamento] = useState(new Date().toISOString().split('T')[0])
  
  const [novoLoteData, setNovoLoteData] = useState({
    nome: '', data_inicio: new Date().toISOString().split('T')[0]
  })
  
  const [editandoLoteData, setEditandoLoteData] = useState({
    nome: '', data_inicio: ''
  })

  useEffect(() => { checkAuth() }, [])

  const SESSION_DAYS = 7 // Sessão expira em 7 dias

  const checkAuth = async () => {
    const savedAuth = localStorage.getItem('agroprimos_auth')
    const authExpiry = localStorage.getItem('agroprimos_auth_expiry')
    
    // Verificar se sessão expirou
    if (savedAuth === 'true' && authExpiry) {
      const expiryDate = new Date(authExpiry)
      if (new Date() > expiryDate) {
        // Sessão expirou - fazer logout
        localStorage.removeItem('agroprimos_auth')
        localStorage.removeItem('agroprimos_auth_expiry')
        localStorage.removeItem('agroprimos_socio_id')
        localStorage.removeItem('agroprimos_socio_nome')
        setLoading(false)
        return
      }
      setIsAuthenticated(true)
      await loadAllData()
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    const { data: socioData } = await supabase.from('socios').select('id, nome, senha').eq('senha', password).single()
    if (socioData) {
      // Salvar auth com data de expiração
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + SESSION_DAYS)
      localStorage.setItem('agroprimos_auth', 'true')
      localStorage.setItem('agroprimos_auth_expiry', expiryDate.toISOString())
      localStorage.setItem('agroprimos_socio_id', socioData.id.toString())
      localStorage.setItem('agroprimos_socio_nome', socioData.nome)
      setIsAuthenticated(true)
      await loadAllData()
    } else { alert('Senha incorreta!') }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('agroprimos_auth')
    localStorage.removeItem('agroprimos_auth_expiry')
    localStorage.removeItem('agroprimos_socio_id')
    localStorage.removeItem('agroprimos_socio_nome')
    setIsAuthenticated(false)
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const { data: sociosData } = await supabase.from('socios').select('*').order('id')
      setSocios(sociosData || [])
      const { data: loteData } = await supabase.from('lotes').select('*').eq('status', 'ativo').single()
      setLoteAtual(loteData)
      const { data: lotesData } = await supabase.from('lotes').select('*').order('data_inicio', { ascending: false })
      setLotes(lotesData || [])
      // Carregar todos os lançamentos de todos os lotes (para calcular rendimento correto no preview)
      const { data: todosLancamentosData } = await supabase.from('lancamentos').select('*')
      setTodosLancamentos(todosLancamentosData || [])
      if (loteData) {
        const { data: animaisData } = await supabase.from('animais').select('*').eq('lote_id', loteData.id)
        setAnimais(animaisData || [])
        const { data: lancamentosData } = await supabase.from('lancamentos').select('*').eq('lote_id', loteData.id).order('data', { ascending: false })
        setLancamentos(lancamentosData || [])
        const animalIds = (animaisData || []).map(a => a.id)
        if (animalIds.length > 0) {
          const { data: pesagensData } = await supabase.from('pesagens').select('*').in('animal_id', animalIds).order('data', { ascending: true })
          setPesagens(pesagensData || [])
        } else { setPesagens([]) }
        const { data: caixaData } = await supabase.from('v_caixa_atual').select('*').single()
        setCaixa(caixaData)
        const { data: sociosLoteData } = await supabase.from('v_socios_lote_atual').select('*')
        setSociosLote(sociosLoteData || [])
      } else {
        setAnimais([]); setLancamentos([]); setPesagens([]); setCaixa(null); setSociosLote([])
      }
    } catch (error) { console.error('Erro:', error) }
    setLoading(false)
  }

  const handleCriarNovoLote = async () => {
    if (!novoLoteData.nome || !novoLoteData.data_inicio) { alert('Preencha o nome e a data!'); return }
    const { error } = await supabase.from('lotes').insert({ nome: novoLoteData.nome, data_inicio: novoLoteData.data_inicio, status: 'ativo' })
    if (error) { alert('Erro: ' + error.message) } 
    else { setShowNovoLote(false); setNovoLoteData({ nome: '', data_inicio: new Date().toISOString().split('T')[0] }); alert('Lote criado!'); await loadAllData() }
  }

  const handleEditarLote = async () => {
    if (!editandoLoteData.nome || !editandoLoteData.data_inicio) { alert('Preencha todos os campos!'); return }
    await supabase.from('lotes').update({ nome: editandoLoteData.nome, data_inicio: editandoLoteData.data_inicio }).eq('id', loteAtual.id)
    setShowEditarLote(false); await loadAllData()
  }

  const handleSaveLancamento = async () => {
    if (!novoLancamento.categoria || !novoLancamento.valor || !novoLancamento.data) { alert('Preencha todos os campos!'); return }
    if ((novoLancamento.tipo === 'aporte' || novoLancamento.tipo === 'dividendo') && !novoLancamento.socio_id) { alert('Selecione o sócio!'); return }
    let valorFinal = parseFloat(novoLancamento.valor)
    if (novoLancamento.tipo === 'saida' || novoLancamento.tipo === 'infraestrutura' || novoLancamento.tipo === 'dividendo') valorFinal = -Math.abs(valorFinal)
    
    // Montar descrição com nome do sócio para aportes e dividendos
    let descricaoFinal = novoLancamento.descricao
    if (novoLancamento.tipo === 'aporte') {
      const socio = socios.find(s => s.id === parseInt(novoLancamento.socio_id))
      const tipoAporte = novoLancamento.subcategoria === 'aporte_inicial' ? 'Aporte Inicial' : 'Aporte'
      const base = socio ? `${tipoAporte} - ${socio.nome}` : tipoAporte
      descricaoFinal = novoLancamento.descricao ? `${base} - ${novoLancamento.descricao}` : base
    } else if (novoLancamento.tipo === 'dividendo') {
      const socio = socios.find(s => s.id === parseInt(novoLancamento.socio_id))
      const base = socio ? `Dividendo - ${socio.nome}` : 'Dividendo'
      descricaoFinal = novoLancamento.descricao ? `${base} - ${novoLancamento.descricao}` : base
    }
    
    await supabase.from('lancamentos').insert({
      lote_id: loteAtual.id, tipo: novoLancamento.tipo, categoria: novoLancamento.categoria,
      descricao: descricaoFinal, valor: valorFinal, data: novoLancamento.data,
      socio_id: (novoLancamento.tipo === 'aporte' || novoLancamento.tipo === 'dividendo') ? parseInt(novoLancamento.socio_id) : null, rateio_lote: novoLancamento.rateio_lote
    })
    setShowNewLancamento(false)
    setNovoLancamento({ tipo: 'saida', categoria: '', subcategoria: '', descricao: '', valor: '', data: new Date().toISOString().split('T')[0], socio_id: '', rateio_lote: true })
    await loadAllData()
  }

  const handleDuplicarLancamento = (l) => {
    setNovoLancamento({
      tipo: l.tipo, categoria: l.categoria, subcategoria: '', descricao: l.descricao || '',
      valor: Math.abs(l.valor).toString(), data: new Date().toISOString().split('T')[0],
      socio_id: l.socio_id?.toString() || '', rateio_lote: l.rateio_lote
    })
    setShowNewLancamento(true)
  }

  const handleEditLancamento = (l) => { setEditandoLancamento({...l, valor: Math.abs(l.valor).toString()}); setShowEditLancamento(true) }

  const handleSaveEditLancamento = async () => {
    if (!editandoLancamento.categoria || !editandoLancamento.valor) { alert('Preencha os campos!'); return }
    let valorFinal = parseFloat(editandoLancamento.valor)
    if (editandoLancamento.tipo === 'saida' || editandoLancamento.tipo === 'infraestrutura' || editandoLancamento.tipo === 'dividendo') valorFinal = -Math.abs(valorFinal)
    else valorFinal = Math.abs(valorFinal)
    await supabase.from('lancamentos').update({
      tipo: editandoLancamento.tipo, categoria: editandoLancamento.categoria, descricao: editandoLancamento.descricao,
      valor: valorFinal, data: editandoLancamento.data,
      socio_id: (editandoLancamento.tipo === 'aporte' || editandoLancamento.tipo === 'dividendo') ? parseInt(editandoLancamento.socio_id) : null
    }).eq('id', editandoLancamento.id)
    setShowEditLancamento(false); setEditandoLancamento(null); await loadAllData()
  }

  const handleDeleteLancamento = async (id) => {
    if (!confirm('Excluir lançamento?')) return
    await supabase.from('lancamentos').delete().eq('id', id)
    await loadAllData()
  }

  // Arroba vivo (compra) = 15kg, Arroba morto (venda) = 30kg
  const ARROBA_VIVO = 15
  const ARROBA_MORTO = 30

  const handleSaveAnimal = async () => {
    if (!novoAnimal.nome || !novoAnimal.arroba_compra || !novoAnimal.valor_compra) { alert('Preencha os campos!'); return }
    const arrobaCompra = parseFloat(novoAnimal.arroba_compra)
    const pesoCompra = arrobaCompra * ARROBA_VIVO
    const { data: animalData } = await supabase.from('animais').insert({
      lote_id: loteAtual.id, nome: novoAnimal.nome, apelido: novoAnimal.apelido, brinco: novoAnimal.brinco,
      raca: novoAnimal.raca, sexo: novoAnimal.sexo, idade: novoAnimal.idade, cor: novoAnimal.cor,
      peso_compra: pesoCompra, arroba_compra: arrobaCompra, valor_compra: parseFloat(novoAnimal.valor_compra),
      data_compra: novoAnimal.data_compra, peso_atual: pesoCompra, arroba_atual: arrobaCompra,
      observacoes: novoAnimal.observacoes, status: 'ativo'
    }).select().single()
    if (animalData) {
      await supabase.from('pesagens').insert({ animal_id: animalData.id, data: novoAnimal.data_compra, peso: pesoCompra, arroba: arrobaCompra, observacao: 'Peso de entrada' })
      await supabase.from('lancamentos').insert({ lote_id: loteAtual.id, animal_id: animalData.id, tipo: 'saida', categoria: 'compra_gado', descricao: novoAnimal.nome, valor: -parseFloat(novoAnimal.valor_compra), data: novoAnimal.data_compra, rateio_lote: false })
    }
    setShowNewAnimal(false)
    setNovoAnimal({ nome: '', apelido: '', brinco: '', raca: 'Nelore', sexo: 'Fêmea', idade: '', cor: '', arroba_compra: '', valor_compra: '', data_compra: new Date().toISOString().split('T')[0], observacoes: '' })
    await loadAllData()
  }

  const handleSavePesagem = async () => {
    if (!novaPesagem.arroba || !novaPesagem.data) { alert('Preencha os campos!'); return }
    const arroba = parseFloat(novaPesagem.arroba)
    const peso = arroba * ARROBA_VIVO
    await supabase.from('pesagens').insert({ animal_id: selectedAnimal.id, data: novaPesagem.data, peso, arroba, observacao: novaPesagem.observacao })
    await supabase.from('animais').update({ peso_atual: peso, arroba_atual: arroba }).eq('id', selectedAnimal.id)
    setShowAddPesagem(false); setNovaPesagem({ data: new Date().toISOString().split('T')[0], arroba: '', observacao: '' })
    await loadAllData()
    const { data: upd } = await supabase.from('animais').select('*').eq('id', selectedAnimal.id).single()
    setSelectedAnimal(upd)
  }

  const handleEditPesagem = (p) => { setEditandoPesagem({...p, arroba: p.arroba?.toString() || ''}); setShowEditPesagem(true) }

  const handleSaveEditPesagem = async () => {
    if (!editandoPesagem.arroba) { alert('Preencha a arroba!'); return }
    const arroba = parseFloat(editandoPesagem.arroba)
    const peso = arroba * ARROBA_VIVO
    await supabase.from('pesagens').update({ data: editandoPesagem.data, peso, arroba, observacao: editandoPesagem.observacao }).eq('id', editandoPesagem.id)
    const animalPesagens = pesagens.filter(p => p.animal_id === selectedAnimal.id)
    const ultima = animalPesagens[animalPesagens.length - 1]
    if (ultima && ultima.id === editandoPesagem.id) await supabase.from('animais').update({ peso_atual: peso, arroba_atual: arroba }).eq('id', selectedAnimal.id)
    setShowEditPesagem(false); setEditandoPesagem(null); await loadAllData()
    const { data: upd } = await supabase.from('animais').select('*').eq('id', selectedAnimal.id).single()
    setSelectedAnimal(upd)
  }

  const handleDeletePesagem = async (id) => {
    if (!confirm('Excluir pesagem?')) return
    await supabase.from('pesagens').delete().eq('id', id)
    await loadAllData()
    const { data: upd } = await supabase.from('animais').select('*').eq('id', selectedAnimal.id).single()
    setSelectedAnimal(upd)
  }

  // Venda usa arroba morto (30kg)
  const handleVendaAnimal = async (animalId, arrobaVenda, valorVenda, dataVenda) => {
    const arroba = parseFloat(arrobaVenda)
    const peso = arroba * ARROBA_MORTO // Peso morto
    await supabase.from('animais').update({ peso_venda: peso, arroba_venda: arroba, valor_venda: parseFloat(valorVenda), data_venda: dataVenda, status: 'vendido' }).eq('id', animalId)
    await supabase.from('pesagens').insert({ animal_id: animalId, data: dataVenda, peso, arroba, observacao: 'Peso de venda (@ morto)' })
    const animal = animais.find(a => a.id === animalId)
    await supabase.from('lancamentos').insert({ lote_id: loteAtual.id, animal_id: animalId, tipo: 'entrada', categoria: 'venda_gado', descricao: animal?.nome || 'Venda', valor: parseFloat(valorVenda), data: dataVenda, rateio_lote: false })
    await loadAllData(); setShowAnimalModal(false)
  }

  const handleEditAnimal = (a) => {
    setEditandoAnimal({
      id: a.id, nome: a.nome, apelido: a.apelido || '', brinco: a.brinco || '',
      raca: a.raca, sexo: a.sexo, idade: a.idade || '', cor: a.cor || '',
      arroba_compra: a.arroba_compra?.toString() || '', valor_compra: a.valor_compra?.toString() || '',
      data_compra: a.data_compra || '', observacoes: a.observacoes || ''
    })
    setShowEditAnimal(true)
  }

  const handleSaveEditAnimal = async () => {
    if (!editandoAnimal.nome || !editandoAnimal.arroba_compra || !editandoAnimal.valor_compra) { alert('Preencha os campos obrigatórios!'); return }
    const arrobaCompra = parseFloat(editandoAnimal.arroba_compra)
    const pesoCompra = arrobaCompra * ARROBA_VIVO
    await supabase.from('animais').update({
      nome: editandoAnimal.nome, apelido: editandoAnimal.apelido, brinco: editandoAnimal.brinco,
      raca: editandoAnimal.raca, sexo: editandoAnimal.sexo, idade: editandoAnimal.idade, cor: editandoAnimal.cor,
      peso_compra: pesoCompra, arroba_compra: arrobaCompra, valor_compra: parseFloat(editandoAnimal.valor_compra),
      data_compra: editandoAnimal.data_compra, observacoes: editandoAnimal.observacoes
    }).eq('id', editandoAnimal.id)
    await supabase.from('lancamentos').update({
      descricao: editandoAnimal.nome, valor: -parseFloat(editandoAnimal.valor_compra), data: editandoAnimal.data_compra
    }).eq('animal_id', editandoAnimal.id).eq('categoria', 'compra_gado')
    setShowEditAnimal(false); setEditandoAnimal(null); await loadAllData()
    const { data: upd } = await supabase.from('animais').select('*').eq('id', editandoAnimal.id).single()
    setSelectedAnimal(upd)
  }

  const handleDeleteAnimal = async (animalId) => {
    if (!confirm('Excluir este animal? Isso também removerá pesagens e lançamentos.')) return
    await supabase.from('pesagens').delete().eq('animal_id', animalId)
    await supabase.from('lancamentos').delete().eq('animal_id', animalId)
    await supabase.from('animais').delete().eq('id', animalId)
    setShowAnimalModal(false); setSelectedAnimal(null); await loadAllData()
  }

  const handleEditVenda = (a) => { setEditandoVenda({ id: a.id, arroba_venda: a.arroba_venda?.toString() || '', valor_venda: a.valor_venda?.toString() || '', data_venda: a.data_venda || '' }); setShowEditVenda(true) }

  const handleSaveEditVenda = async () => {
    if (!editandoVenda.arroba_venda || !editandoVenda.valor_venda || !editandoVenda.data_venda) { alert('Preencha tudo!'); return }
    const arroba = parseFloat(editandoVenda.arroba_venda)
    const peso = arroba * ARROBA_MORTO
    await supabase.from('animais').update({ peso_venda: peso, arroba_venda: arroba, valor_venda: parseFloat(editandoVenda.valor_venda), data_venda: editandoVenda.data_venda }).eq('id', editandoVenda.id)
    await supabase.from('lancamentos').update({ valor: parseFloat(editandoVenda.valor_venda), data: editandoVenda.data_venda }).eq('animal_id', editandoVenda.id).eq('categoria', 'venda_gado')
    setShowEditVenda(false); setEditandoVenda(null); await loadAllData()
    const { data: upd } = await supabase.from('animais').select('*').eq('id', editandoVenda.id).single()
    setSelectedAnimal(upd)
  }

  const handleCancelarVenda = async (animalId) => {
    if (!confirm('Cancelar venda? Animal voltará para ativo.')) return
    await supabase.from('animais').update({ peso_venda: null, arroba_venda: null, valor_venda: null, data_venda: null, status: 'ativo' }).eq('id', animalId)
    await supabase.from('lancamentos').delete().eq('animal_id', animalId).eq('categoria', 'venda_gado')
    await supabase.from('pesagens').delete().eq('animal_id', animalId).ilike('observacao', '%venda%')
    await loadAllData(); setShowAnimalModal(false)
  }

  const handleFecharLote = async () => {
    const animaisAtivos = animais.filter(a => a.status === 'ativo')
    if (animaisAtivos.length > 0) { alert('Ainda existem ' + animaisAtivos.length + ' animal(is) não vendido(s).'); return }
    const semVendaCompleta = animais.filter(a => !a.arroba_venda || !a.valor_venda || !a.data_venda)
    if (semVendaCompleta.length > 0) { alert('Alguns animais com dados de venda incompletos.'); return }
    if (!confirm('Confirma fechamento do lote?')) return
    const totalAportes = lancamentos.filter(l => l.tipo === 'aporte').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const totalEntradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const totalSaidas = lancamentos.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const totalInfra = lancamentos.filter(l => l.tipo === 'infraestrutura').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    await supabase.from('lotes').update({
      status: 'fechado', data_fim: dataFechamento, observacoes: observacoesFechamento,
      resultado_bruto: totalEntradas - totalSaidas, resultado_liquido: totalEntradas - totalSaidas - totalInfra,
      total_aportes: totalAportes, total_vendas: totalEntradas, total_custos: totalSaidas, total_infraestrutura: totalInfra
    }).eq('id', loteAtual.id)
    setShowFecharLote(false); setObservacoesFechamento(''); setDataFechamento(new Date().toISOString().split('T')[0]); alert('Lote fechado!'); await loadAllData()
  }

  const loadLoteData = async (loteId) => {
    const { data: lote } = await supabase.from('lotes').select('*').eq('id', loteId).single()
    const { data: animaisData } = await supabase.from('animais').select('*').eq('lote_id', loteId)
    const { data: lancamentosData } = await supabase.from('lancamentos').select('*').eq('lote_id', loteId).order('data', { ascending: false })
    let pesagensData = []
    const ids = (animaisData || []).map(a => a.id)
    if (ids.length > 0) { const { data } = await supabase.from('pesagens').select('*').in('animal_id', ids); pesagensData = data || [] }
    return { lote, animais: animaisData || [], lancamentos: lancamentosData || [], pesagens: pesagensData }
  }

  const handleSaveObservacoesLote = async (loteId, obs) => {
    await supabase.from('lotes').update({ observacoes: obs }).eq('id', loteId)
    await loadAllData()
    const upd = await loadLoteData(loteId)
    setSelectedLote(upd)
    alert('Observações salvas!')
  }

  const calcularIndicadores = () => {
    if (!caixa) return { totalAportes: 0, totalEntradas: 0, custoTotal: 0, totalInfra: 0, caixaAtual: 0, patrimonioGado: 0, animaisAtivos: 0, animaisVendidos: 0, totalArrobasAtivas: 0, minimoPorCabeca: 0 }
    const totalAportes = parseFloat(caixa.total_aportes) || 0
    const totalEntradas = parseFloat(caixa.total_entradas) || 0
    const totalSaidas = Math.abs(parseFloat(caixa.total_saidas)) || 0
    const totalInfra = Math.abs(parseFloat(caixa.total_infraestrutura)) || 0
    const caixaAtual = parseFloat(caixa.caixa_atual) || 0
    const patrimonioGado = animais.filter(a => a.status === 'ativo').reduce((acc, a) => acc + parseFloat(a.valor_compra || 0), 0)
    const animaisAtivosArr = animais.filter(a => a.status === 'ativo')
    const animaisVendidos = animais.filter(a => a.status === 'vendido')
    const totalArrobasAtivas = animaisAtivosArr.reduce((acc, a) => acc + parseFloat(a.arroba_atual || 0), 0)
    // Resultado Bruto = Entradas - Custos
    const resultadoBruto = totalEntradas - totalSaidas
    // Mínimo por cabeça para ponto de equilíbrio = -Resultado Bruto / Animais ativos (quanto falta por animal para empatar)
    const minimoPorCabeca = animaisAtivosArr.length > 0 ? Math.abs(resultadoBruto) / animaisAtivosArr.length : 0
    return { totalAportes, totalEntradas, custoTotal: totalSaidas, totalInfra, caixaAtual, patrimonioGado, animaisAtivos: animaisAtivosArr.length, animaisVendidos: animaisVendidos.length, totalArrobasAtivas, minimoPorCabeca, resultadoBruto }
  }
  
  const indicadores = calcularIndicadores()
  const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
  const formatDate = (d) => { if (!d) return '-'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }
  const calcularDiasLote = (ini, fim) => { if (!ini) return 0; const i = new Date(ini), f = fim ? new Date(fim) : new Date(); return Math.floor((f - i) / (1000 * 60 * 60 * 24)) }
  const calcularMesesLote = (ini, fim) => { const dias = calcularDiasLote(ini, fim); return (dias / 30).toFixed(1) }
  const getPesagensAnimal = (id) => pesagens.filter(p => p.animal_id === id).sort((a, b) => new Date(a.data) - new Date(b.data))

  // Filtrar lançamentos
  const lancamentosFiltrados = lancamentos.filter(l => {
    if (filtroData && l.data !== filtroData) return false
    if (filtroCategoria && l.categoria !== filtroCategoria) return false
    return true
  })
  
  const categoriasUnicas = [...new Set(lancamentos.map(l => l.categoria))]

  const calcularDRE = () => {
    const aportes = lancamentos.filter(l => l.tipo === 'aporte').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const vendasGado = lancamentos.filter(l => l.categoria === 'venda_gado').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const outrasEntradas = lancamentos.filter(l => l.tipo === 'entrada' && l.categoria !== 'venda_gado').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const compraGado = lancamentos.filter(l => l.categoria === 'compra_gado').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const racao = lancamentos.filter(l => l.categoria === 'racao').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const medicamentos = lancamentos.filter(l => l.categoria === 'medicamento').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const frete = lancamentos.filter(l => l.categoria === 'frete').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const outrosCustos = lancamentos.filter(l => l.tipo === 'saida' && !['compra_gado', 'racao', 'medicamento', 'frete'].includes(l.categoria)).reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const infraestrutura = lancamentos.filter(l => l.tipo === 'infraestrutura').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const dividendos = lancamentos.filter(l => l.tipo === 'dividendo').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const totalReceitas = vendasGado + outrasEntradas, totalCustos = compraGado + racao + medicamentos + frete + outrosCustos, totalDespesas = infraestrutura
    const resultadoBruto = totalReceitas - totalCustos, resultadoLiquido = resultadoBruto - totalDespesas
    const resultadoFinal = resultadoLiquido - dividendos
    const diasLote = calcularDiasLote(loteAtual?.data_inicio), mesesLote = diasLote / 30
    
    // Juros compostos: (((Resultado + Aportes) / Aportes) ^ (1 / Meses)) - 1
    const montanteBruto = resultadoBruto + aportes
    const montanteLiquido = resultadoLiquido + aportes
    const rendimentoSoCustos = mesesLote > 0 && aportes > 0 ? (Math.pow(montanteBruto / aportes, 1 / mesesLote) - 1) * 100 : 0
    const rendimentoComDespesas = mesesLote > 0 && aportes > 0 ? (Math.pow(montanteLiquido / aportes, 1 / mesesLote) - 1) * 100 : 0
    
    return { aportes, vendasGado, outrasEntradas, totalReceitas, compraGado, racao, medicamentos, frete, outrosCustos, totalCustos, infraestrutura, totalDespesas, resultadoBruto, resultadoLiquido, dividendos, resultadoFinal, rendimentoSoCustos, rendimentoComDespesas }
  }

  // Calcular rendimento de um lote fechado (JUROS COMPOSTOS)
  // Fórmula: (((Resultado + Aportes) / Aportes) ^ (1 / Meses)) - 1
  // Calcular rendimento de um lote fechado (JUROS COMPOSTOS)
  // Usa os lançamentos para calcular valores atualizados
  const calcularRendimentoLote = (lote) => {
    if (!lote) return { soCustos: 0, comDespesas: 0 }
    
    // Filtrar lançamentos deste lote
    const lancamentosLote = todosLancamentos.filter(l => l.lote_id === lote.id)
    
    // Calcular totais dos lançamentos
    const totalAportes = lancamentosLote.filter(l => l.tipo === 'aporte').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const totalVendas = lancamentosLote.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
    const totalCustos = lancamentosLote.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    const totalDespesas = lancamentosLote.filter(l => l.tipo === 'infraestrutura').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
    
    if (totalAportes <= 0) return { soCustos: 0, comDespesas: 0 }
    
    const resultadoBruto = totalVendas - totalCustos
    const resultadoLiquido = resultadoBruto - totalDespesas
    
    const dias = calcularDiasLote(lote.data_inicio, lote.data_fim)
    const meses = dias / 30
    if (meses <= 0) return { soCustos: 0, comDespesas: 0 }
    
    // Montante = Resultado + Aportes (o que sobrou no final)
    const montanteBruto = resultadoBruto + totalAportes
    const montanteLiquido = resultadoLiquido + totalAportes
    
    // Taxa mensal = (Montante / Principal) ^ (1/meses) - 1
    const soCustos = (Math.pow(montanteBruto / totalAportes, 1 / meses) - 1) * 100
    const comDespesas = (Math.pow(montanteLiquido / totalAportes, 1 / meses) - 1) * 100
    
    return { soCustos, comDespesas }
  }

  if (loading) return (<div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center"><div className="text-white text-xl">Carregando...</div></div>)

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-3xl p-8 md:p-12 w-full max-w-md shadow-2xl text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-700 to-green-900 rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center text-3xl md:text-4xl">🐄</div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-green-900 mb-2">AgroPrimos</h1>
        <p className="text-gray-500 mb-6 md:mb-8 text-sm">Gestão de Gado da Família</p>
        <input type="password" placeholder="Digite a senha" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full p-4 text-base border-2 border-gray-200 rounded-xl outline-none mb-4 focus:border-green-600" />
        <button onClick={handleLogin} className="w-full p-4 text-base font-semibold text-white bg-gradient-to-r from-green-700 to-green-900 rounded-xl hover:opacity-90 active:scale-[0.98]">Entrar</button>
        <p className="mt-4 md:mt-6 text-xs text-gray-400">Agropecuária Cambui • Junqueiro - AL</p>
      </div>
    </div>
  )

  const Card = ({ title, value, subtitle, icon, large = false, className = '' }) => (
    <div className={`rounded-2xl p-4 md:p-5 shadow-lg ${large ? 'bg-gradient-to-br from-green-900 to-green-700 text-white' : 'bg-white'} ${className}`}>
      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2"><span className={large ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}>{icon}</span><span className={`text-[10px] md:text-xs font-medium uppercase tracking-wide ${large ? 'opacity-90' : 'opacity-60'}`}>{title}</span></div>
      <div className={`font-bold ${large ? 'text-xl md:text-3xl' : 'text-lg md:text-2xl'}`}>{value}</div>
      {subtitle && <div className={`text-xs md:text-sm mt-1 ${large ? 'opacity-80' : 'opacity-60'}`}>{subtitle}</div>}
    </div>
  )

  const NavItem = ({ page, icon, label }) => (
    <button onClick={() => { setCurrentPage(page); setMobileMenuOpen(false) }} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all text-left ${currentPage === page ? 'bg-green-100 text-green-900 font-semibold' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'}`}>
      <span className="text-xl">{icon}</span><span className="text-sm md:text-base">{label}</span>
    </button>
  )

  const renderContent = () => {
    if (!loteAtual) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="text-6xl md:text-8xl mb-6">🐄</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2">Nenhum lote ativo</h2>
          <p className="text-gray-500 mb-6 text-sm md:text-base">Crie um novo lote para começar a gerenciar seus animais</p>
          <button onClick={() => setShowNovoLote(true)} className="px-6 py-4 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 active:scale-[0.98] text-base md:text-lg">+ Criar Novo Lote</button>
          {lotes.filter(l => l.status === 'fechado').length > 0 && (
            <div className="mt-8 w-full max-w-md">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Lotes anteriores:</h3>
              <div className="space-y-2">
                {lotes.filter(l => l.status === 'fechado').slice(0, 3).map(lote => {
                  const rend = calcularRendimentoLote(lote)
                  return (
                    <div key={lote.id} className="bg-white rounded-xl p-4 shadow text-left">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{lote.nome}</span>
                        <span className={`text-sm font-semibold ${(lote.resultado_liquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(lote.resultado_liquido)}</span>
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(lote.data_inicio)} - {formatDate(lote.data_fim)} • {rend.soCustos.toFixed(2)}% a.m.</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }

    switch(currentPage) {
      case 'dashboard':
        return (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-green-900">📊 Lote Atual</h2>
              <button onClick={() => { setEditandoLoteData({ nome: loteAtual.nome, data_inicio: loteAtual.data_inicio }); setShowEditarLote(true) }} className="text-sm text-green-700 font-medium hover:underline">✏️ Editar lote</button>
            </div>
            <div className="mb-4 md:mb-6"><Card title="Caixa Atual" value={formatMoney(indicadores.caixaAtual)} subtitle="Disponível para operações" icon="💰" large={true} /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <Card title="Aportes" value={formatMoney(indicadores.totalAportes)} icon="📥" />
              <Card title="Custos" value={formatMoney(indicadores.custoTotal)} icon="💸" />
              <Card title="Infraestrutura" value={formatMoney(indicadores.totalInfra)} icon="🔧" />
              <Card title="Patrimônio" value={formatMoney(indicadores.patrimonioGado)} icon="🐄" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <Card title="Lote" value={loteAtual?.nome || '-'} icon="🏷️" />
              <Card title="Início" value={formatDate(loteAtual?.data_inicio)} icon="📅" />
              <Card title="Dias" value={calcularDiasLote(loteAtual?.data_inicio) + ' dias'} icon="⏱️" />
              <Card title="Animais" value={indicadores.animaisAtivos + ' ativos'} subtitle={indicadores.animaisVendidos + ' vendidos'} icon="🐄" />
            </div>
            {animais.length > 0 && animais.every(a => a.status === 'vendido') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm md:text-base"><span className="text-yellow-700 font-medium">⚠️ Todos os animais vendidos - Pronto para fechar o lote</span></div>
            )}
          </div>
        )

      case 'lancamentos':
        return (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-green-900">💳 Lançamentos</h2>
              <button onClick={() => setShowNewLancamento(true)} className="w-full md:w-auto px-4 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 active:scale-[0.98] text-sm md:text-base">+ Novo Lançamento</button>
            </div>
            {/* Filtros */}
            <div className="bg-white rounded-xl p-4 shadow mb-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1">Filtrar por data</label>
                <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-gray-500 mb-1">Filtrar por categoria</label>
                <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">Todas</option>
                  {categoriasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(filtroData || filtroCategoria) && (
                <button onClick={() => { setFiltroData(''); setFiltroCategoria('') }} className="self-end px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">Limpar</button>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {lancamentosFiltrados.map((item, idx) => (
                <div key={item.id} className={`p-3 md:p-4 flex justify-between items-center gap-3 ${idx < lancamentosFiltrados.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-base md:text-lg flex-shrink-0 ${item.tipo === 'entrada' || item.tipo === 'aporte' ? 'bg-green-100' : item.tipo === 'infraestrutura' ? 'bg-orange-100' : item.tipo === 'dividendo' ? 'bg-purple-100' : 'bg-red-100'}`}>
                      {item.tipo === 'entrada' || item.tipo === 'aporte' ? '📥' : item.tipo === 'infraestrutura' ? '🔧' : item.tipo === 'dividendo' ? '💸' : '📤'}
                    </div>
                    <div className="min-w-0 flex-1"><div className="font-medium text-sm md:text-base truncate">{item.descricao || item.categoria}</div><div className="text-xs md:text-sm text-gray-400 truncate">{item.categoria} • {formatDate(item.data)}</div></div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <div className={`font-semibold text-sm md:text-base ${item.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(item.valor)}</div>
                    <div className="flex gap-1">
                      <button onClick={() => handleDuplicarLancamento(item)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Duplicar">📋</button>
                      <button onClick={() => handleEditLancamento(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">✏️</button>
                      <button onClick={() => handleDeleteLancamento(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              {lancamentosFiltrados.length === 0 && <div className="p-8 text-center text-gray-400">{lancamentos.length === 0 ? 'Nenhum lançamento' : 'Nenhum resultado para o filtro'}</div>}
            </div>
          </div>
        )

      case 'animais':
        return (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-green-900">🐄 Animais do Lote</h2>
              <button onClick={() => setShowNewAnimal(true)} className="w-full md:w-auto px-4 py-3 bg-green-900 text-white rounded-xl font-semibold hover:bg-green-800 active:scale-[0.98] text-sm md:text-base">+ Novo Animal</button>
            </div>
            <div className="space-y-4">
              {animais.map(animal => {
                const ganhoArroba = (parseFloat(animal.arroba_atual) || 0) - (parseFloat(animal.arroba_compra) || 0)
                return (
                  <div key={animal.id} onClick={() => { setSelectedAnimal(animal); setShowAnimalModal(true) }} className="bg-white rounded-2xl p-4 md:p-6 shadow-lg cursor-pointer hover:shadow-xl active:scale-[0.99]">
                    <div className="flex justify-between items-start mb-4 md:mb-5">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-600 flex items-center justify-center text-2xl md:text-3xl">🐄</div>
                        <div>
                          <div className="text-[10px] md:text-xs text-gray-400">Brinco: {animal.brinco || '-'}</div>
                          <h3 className="text-base md:text-lg font-semibold">{animal.nome}</h3>
                          <p className="text-gray-500 text-xs md:text-sm">"{animal.apelido}" • {animal.raca}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${animal.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{animal.status === 'ativo' ? '🟢 Ativo' : '💰 Vendido'}</span>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 text-center">
                      <div className="bg-gray-50 rounded-xl p-2 md:p-3"><div className="text-[10px] md:text-xs text-gray-400">@ Compra</div><div className="font-semibold text-xs md:text-base">{animal.arroba_compra} @</div></div>
                      <div className="bg-blue-50 rounded-xl p-2 md:p-3"><div className="text-[10px] md:text-xs text-blue-600">@ Atual</div><div className="font-semibold text-blue-700 text-xs md:text-base">{animal.arroba_atual} @</div></div>
                      <div className="bg-green-50 rounded-xl p-2 md:p-3"><div className="text-[10px] md:text-xs text-green-600">Ganho</div><div className="font-semibold text-green-700 text-xs md:text-base">+{ganhoArroba.toFixed(1)} @</div></div>
                      <div className="bg-gray-50 rounded-xl p-2 md:p-3 hidden md:block"><div className="text-[10px] md:text-xs text-gray-400">Compra</div><div className="font-semibold text-xs md:text-base">{formatMoney(animal.valor_compra)}</div></div>
                      {animal.status === 'vendido' ? <div className="bg-blue-50 rounded-xl p-2 md:p-3 hidden md:block"><div className="text-[10px] md:text-xs text-blue-600">Venda</div><div className="font-semibold text-blue-700 text-xs md:text-base">{formatMoney(animal.valor_venda)}</div></div> : <div className="bg-gray-50 rounded-xl p-2 md:p-3 hidden md:block"><div className="text-[10px] md:text-xs text-gray-400">R$/@</div><div className="font-semibold text-xs md:text-base">{formatMoney(animal.valor_compra / animal.arroba_compra)}</div></div>}
                    </div>
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 flex justify-between items-center text-xs md:text-sm text-gray-500">
                      <span>📅 {formatDate(animal.data_compra)}</span>
                      <span className="text-green-700 font-medium">Ver ficha →</span>
                    </div>
                  </div>
                )
              })}
              {animais.length === 0 && <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Nenhum animal cadastrado</div>}
            </div>
          </div>
        )

      case 'socios':
        return (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-green-900 mb-6">👥 Sócios e Participações</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead><tr className="bg-gray-50 text-xs md:text-sm text-gray-500 font-semibold"><th className="p-3 md:p-4 text-left">SÓCIO</th><th className="p-3 md:p-4 text-center">%</th><th className="p-3 md:p-4 text-right">INICIAL</th><th className="p-3 md:p-4 text-right">ATUAIS</th><th className="p-3 md:p-4 text-right">TOTAL</th></tr></thead>
                <tbody>
                  {sociosLote.map((s, idx) => (
                    <tr key={s.socio_id} className={idx < sociosLote.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="p-3 md:p-4"><div className="flex items-center gap-2 md:gap-3"><div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm" style={{ backgroundColor: 'hsl(' + (idx * 60) + ', 70%, 85%)' }}>{s.nome[0]}</div><span className="font-medium text-sm md:text-base">{s.nome}</span></div></td>
                      <td className="p-3 md:p-4 text-center"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">{(parseFloat(s.participacao) * 100).toFixed(1)}%</span></td>
                      <td className="p-3 md:p-4 text-right font-medium text-gray-600 text-xs md:text-sm">{formatMoney(s.aporte_inicial)}</td>
                      <td className="p-3 md:p-4 text-right font-medium text-green-600 text-xs md:text-sm">{formatMoney(s.aportes_atuais)}</td>
                      <td className="p-3 md:p-4 text-right font-semibold text-green-900 text-xs md:text-sm">{formatMoney(s.total_aportes)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-green-900 text-white font-semibold text-xs md:text-sm"><td className="p-3 md:p-4">TOTAL</td><td className="p-3 md:p-4 text-center">100%</td><td className="p-3 md:p-4 text-right">{formatMoney(sociosLote.reduce((a, s) => a + parseFloat(s.aporte_inicial || 0), 0))}</td><td className="p-3 md:p-4 text-right">{formatMoney(sociosLote.reduce((a, s) => a + parseFloat(s.aportes_atuais || 0), 0))}</td><td className="p-3 md:p-4 text-right">{formatMoney(sociosLote.reduce((a, s) => a + parseFloat(s.total_aportes || 0), 0))}</td></tr></tfoot>
              </table>
            </div>
          </div>
        )

      case 'indicadores':
        const dre = calcularDRE()
        return (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-green-900 mb-6">📈 Indicadores</h2>
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
                <h3 className="text-sm md:text-base font-semibold text-gray-500 mb-4 md:mb-5">🐄 INDICADORES DE GADO</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-gray-50 rounded-xl p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-400 mb-1">Animais Ativos</div><div className="text-xl md:text-2xl font-bold">{indicadores.animaisAtivos}</div></div>
                  <div className="bg-gray-50 rounded-xl p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-400 mb-1">Total @ Vivo</div><div className="text-xl md:text-2xl font-bold">{indicadores.totalArrobasAtivas.toFixed(1)} @</div></div>
                  <div className="bg-gray-50 rounded-xl p-3 md:p-4"><div className="text-[10px] md:text-xs text-gray-400 mb-1">Média @/Animal</div><div className="text-xl md:text-2xl font-bold">{indicadores.animaisAtivos > 0 ? (indicadores.totalArrobasAtivas / indicadores.animaisAtivos).toFixed(1) : '0'} @</div></div>
                  <div className="bg-yellow-50 rounded-xl p-3 md:p-4 border-2 border-yellow-200"><div className="text-[10px] md:text-xs text-yellow-700 mb-1 font-medium">Mín/Cabeça p/ Equilíbrio</div><div className="text-xl md:text-2xl font-bold text-yellow-700">{formatMoney(indicadores.minimoPorCabeca)}</div></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
                <h3 className="text-sm md:text-base font-semibold text-gray-500 mb-4 md:mb-5">💰 DRE - FLUXO DE CAIXA</h3>
                <div className="space-y-1 text-sm">
                  <div className="bg-green-50 rounded-lg p-3 md:p-4">
                    <div className="font-semibold text-green-800 mb-2 md:mb-3 text-xs md:text-sm">RECEITAS</div>
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Venda de Gado</span><span className="font-medium text-green-700">{formatMoney(dre.vendasGado)}</span></div>
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Outras Entradas</span><span className="font-medium text-green-700">{formatMoney(dre.outrasEntradas)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-green-200 font-semibold text-xs md:text-sm"><span className="text-green-800">Total Receitas</span><span className="text-green-800">{formatMoney(dre.totalReceitas)}</span></div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 md:p-4">
                    <div className="font-semibold text-red-800 mb-2 md:mb-3 text-xs md:text-sm">(-) CUSTOS</div>
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Compra de Gado</span><span className="font-medium text-red-600">-{formatMoney(dre.compraGado)}</span></div>
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Ração</span><span className="font-medium text-red-600">-{formatMoney(dre.racao)}</span></div>
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Medicamentos</span><span className="font-medium text-red-600">-{formatMoney(dre.medicamentos)}</span></div>
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Frete</span><span className="font-medium text-red-600">-{formatMoney(dre.frete)}</span></div>
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Outros</span><span className="font-medium text-red-600">-{formatMoney(dre.outrosCustos)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-red-200 font-semibold text-xs md:text-sm"><span className="text-red-800">Total Custos</span><span className="text-red-800">-{formatMoney(dre.totalCustos)}</span></div>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 md:p-4 ${dre.resultadoBruto >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}><div className="flex justify-between font-bold text-sm md:text-lg"><span>= RESULTADO BRUTO</span><span className={dre.resultadoBruto >= 0 ? 'text-blue-700' : 'text-red-700'}>{formatMoney(dre.resultadoBruto)}</span></div></div>
                  <div className="bg-orange-50 rounded-lg p-3 md:p-4">
                    <div className="font-semibold text-orange-800 mb-2 md:mb-3 text-xs md:text-sm">(-) DESPESAS</div>
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Infraestrutura</span><span className="font-medium text-orange-600">-{formatMoney(dre.infraestrutura)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-orange-200 font-semibold text-xs md:text-sm"><span className="text-orange-800">Total Despesas</span><span className="text-orange-800">-{formatMoney(dre.totalDespesas)}</span></div>
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 md:p-4 ${dre.resultadoLiquido >= 0 ? 'bg-green-100' : 'bg-red-100'}`}><div className="flex justify-between font-bold text-base md:text-xl"><span>= RESULTADO LÍQUIDO</span><span className={dre.resultadoLiquido >= 0 ? 'text-green-700' : 'text-red-700'}>{formatMoney(dre.resultadoLiquido)}</span></div></div>
                  {dre.dividendos > 0 && (
                    <>
                      <div className="bg-purple-50 rounded-lg p-3 md:p-4">
                        <div className="font-semibold text-purple-800 mb-2 md:mb-3 text-xs md:text-sm">(-) DIVIDENDOS DISTRIBUÍDOS</div>
                        <div className="flex justify-between text-xs md:text-sm"><span className="text-gray-600 pl-2 md:pl-4">Divisão de Lucro</span><span className="font-medium text-purple-600">-{formatMoney(dre.dividendos)}</span></div>
                      </div>
                      <div className={`rounded-lg p-3 md:p-4 ${dre.resultadoFinal >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}><div className="flex justify-between font-bold text-base md:text-xl"><span>= SALDO FINAL</span><span className={dre.resultadoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}>{formatMoney(dre.resultadoFinal)}</span></div></div>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
                <h3 className="text-sm md:text-base font-semibold text-gray-500 mb-4 md:mb-5">📈 RENDIMENTO</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 md:p-5"><div className="text-xs md:text-sm text-blue-600 mb-1">Rend. a.m. (só custos)</div><div className="text-2xl md:text-3xl font-bold text-blue-700">{dre.rendimentoSoCustos.toFixed(2)}%</div></div>
                  <div className="bg-green-50 rounded-xl p-4 md:p-5"><div className="text-xs md:text-sm text-green-600 mb-1">Rend. a.m. (c/ despesas)</div><div className="text-2xl md:text-3xl font-bold text-green-700">{dre.rendimentoComDespesas.toFixed(2)}%</div></div>
                </div>
                <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gray-50 rounded-lg text-xs md:text-sm text-gray-600"><strong>Aportes:</strong> {formatMoney(dre.aportes)} • <strong>Período:</strong> {calcularDiasLote(loteAtual?.data_inicio)} dias ({calcularMesesLote(loteAtual?.data_inicio)} meses)</div>
              </div>
            </div>
          </div>
        )

      case 'lotes':
        const animaisAtivos = animais.filter(a => a.status === 'ativo')
        const todosVendidos = animais.length > 0 && animaisAtivos.length === 0
        return (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-green-900 mb-6">📅 Gestão de Lotes</h2>
            {loteAtual && (
              <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-2xl md:rounded-3xl p-5 md:p-7 mb-6 text-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-5">
                  <div><span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">LOTE ATIVO</span><h3 className="text-xl md:text-2xl font-bold mt-2 md:mt-3">{loteAtual.nome}</h3><p className="opacity-80 text-sm md:text-base">{formatDate(loteAtual.data_inicio)} • {calcularDiasLote(loteAtual.data_inicio)} dias ({calcularMesesLote(loteAtual.data_inicio)} meses)</p></div>
                  <div className="text-left md:text-right"><div className="text-xs md:text-sm opacity-80 mb-1">Caixa Atual</div><div className="text-2xl md:text-3xl font-bold">{formatMoney(indicadores.caixaAtual)}</div></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-5 bg-white/10 rounded-xl mb-4 md:mb-5">
                  <div className="text-center"><div className="text-[10px] md:text-xs opacity-80 mb-1">Animais</div><div className="text-lg md:text-xl font-bold">{animais.length}</div><div className="text-[10px] md:text-xs opacity-70">{animaisAtivos.length} ativos</div></div>
                  <div className="text-center"><div className="text-[10px] md:text-xs opacity-80 mb-1">Aportes</div><div className="text-lg md:text-xl font-bold">{formatMoney(indicadores.totalAportes)}</div></div>
                  <div className="text-center"><div className="text-[10px] md:text-xs opacity-80 mb-1">Custos</div><div className="text-lg md:text-xl font-bold">{formatMoney(indicadores.custoTotal)}</div></div>
                  <div className="text-center"><div className="text-[10px] md:text-xs opacity-80 mb-1">Resultado</div><div className={`text-lg md:text-xl font-bold ${indicadores.caixaAtual >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatMoney(indicadores.caixaAtual)}</div></div>
                </div>
                <div className="mb-4 p-3 md:p-4 bg-white/10 rounded-xl">
                  <div className="text-xs md:text-sm font-medium mb-2">Checklist para fechar:</div>
                  <div className="space-y-1 text-xs md:text-sm">
                    <div className={animais.length > 0 ? 'text-green-300' : 'text-red-300'}>{animais.length > 0 ? '✅' : '❌'} Animais ({animais.length})</div>
                    <div className={todosVendidos ? 'text-green-300' : 'text-yellow-300'}>{todosVendidos ? '✅' : '⏳'} Todos vendidos ({animais.filter(a => a.status === 'vendido').length}/{animais.length})</div>
                    <div className={lancamentos.length > 0 ? 'text-green-300' : 'text-red-300'}>{lancamentos.length > 0 ? '✅' : '❌'} Lançamentos ({lancamentos.length})</div>
                  </div>
                </div>
                <button onClick={() => { if (!todosVendidos) { alert('Venda todos os animais primeiro!'); return }; setShowFecharLote(true) }} disabled={!todosVendidos} className={`w-full py-3 md:py-4 rounded-xl font-semibold text-sm md:text-base active:scale-[0.98] ${todosVendidos ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-500 opacity-60 cursor-not-allowed'}`}>🔒 Fechar Lote</button>
              </div>
            )}
            <h3 className="text-base md:text-lg font-semibold text-gray-500 mb-4">📚 Histórico</h3>
            <div className="space-y-3 md:space-y-4">
              {lotes.filter(l => l.status === 'fechado').map(lote => {
                const rend = calcularRendimentoLote(lote)
                return (
                  <div key={lote.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                      <div>
                        <h3 className="text-base md:text-lg font-semibold">{lote.nome}</h3>
                        <div className="text-xs text-gray-500">{formatDate(lote.data_inicio)} - {formatDate(lote.data_fim)} • {calcularMesesLote(lote.data_inicio, lote.data_fim)} meses</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${rend.soCustos >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rend.soCustos.toFixed(2)}% a.m.</span>
                        <button onClick={async () => { const data = await loadLoteData(lote.id); setSelectedLote(data); setShowLoteDetalhes(true) }} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs md:text-sm font-medium active:bg-green-200">📄 One-Page</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5 text-sm">
                      <div><div className="text-[10px] md:text-xs text-gray-400 mb-1">Aportes</div><div className="font-semibold text-xs md:text-base">{formatMoney(lote.total_aportes)}</div></div>
                      <div><div className="text-[10px] md:text-xs text-gray-400 mb-1">Vendas</div><div className="font-semibold text-green-600 text-xs md:text-base">{formatMoney(lote.total_vendas)}</div></div>
                      <div className="hidden md:block"><div className="text-xs text-gray-400 mb-1">Custos</div><div className="font-semibold text-red-600">{formatMoney(lote.total_custos)}</div></div>
                      <div className="hidden md:block"><div className="text-xs text-gray-400 mb-1">Res. Bruto</div><div className={`font-semibold ${(lote.resultado_bruto || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(lote.resultado_bruto)}</div></div>
                      <div><div className="text-[10px] md:text-xs text-gray-400 mb-1">Res. Líquido</div><div className={`font-semibold text-xs md:text-base ${(lote.resultado_liquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(lote.resultado_liquido)}</div></div>
                    </div>
                  </div>
                )
              })}
              {lotes.filter(l => l.status === 'fechado').length === 0 && <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">Nenhum lote fechado</div>}
            </div>
          </div>
        )

      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <button className="md:hidden text-xl p-2 -ml-2 hover:bg-gray-100 rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
          <span className="text-2xl md:text-3xl">🐄</span>
          <h1 className="text-lg md:text-xl font-bold text-green-900">AgroPrimos</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="hidden md:inline text-sm text-gray-500">Olá, <strong className="text-green-900">{typeof window !== 'undefined' ? localStorage.getItem('agroprimos_socio_nome') || 'Visitante' : 'Visitante'}</strong></span>
          <button onClick={handleLogout} className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm active:bg-gray-100">Sair</button>
        </div>
      </header>
      
      <div className="flex">
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />}
        <nav className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 w-64 bg-white border-r border-gray-200 p-4 min-h-[calc(100vh-57px)] md:min-h-[calc(100vh-65px)] fixed md:sticky top-[57px] md:top-[65px] left-0 z-40`}>
          <NavItem page="dashboard" icon="📊" label="Lote Atual" />
          <NavItem page="lancamentos" icon="💳" label="Lançamentos" />
          <NavItem page="animais" icon="🐄" label="Animais" />
          <NavItem page="socios" icon="👥" label="Sócios" />
          <NavItem page="indicadores" icon="📈" label="Indicadores" />
          <NavItem page="lotes" icon="📅" label="Gestão de Lotes" />
        </nav>
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full">{renderContent()}</main>
      </div>

      {/* Modal: Criar Novo Lote */}
      {showNovoLote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">🐄 Criar Novo Lote</h3>
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Nome do Lote *</label><input type="text" value={novoLoteData.nome} onChange={(e) => setNovoLoteData({...novoLoteData, nome: e.target.value})} placeholder="Ex: Lote 2026.1" className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div>
            <div className="mb-6"><label className="block mb-2 font-medium text-sm">Data de Início *</label><input type="date" value={novoLoteData.data_inicio} onChange={(e) => setNovoLoteData({...novoLoteData, data_inicio: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div>
            <div className="flex gap-3"><button onClick={() => setShowNovoLote(false)} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleCriarNovoLote} className="flex-1 py-3 md:py-4 bg-green-900 text-white rounded-xl font-semibold active:bg-green-800">Criar Lote</button></div>
          </div>
        </div>
      )}

      {/* Modal: Editar Lote */}
      {showEditarLote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">✏️ Editar Lote</h3>
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Nome do Lote</label><input type="text" value={editandoLoteData.nome} onChange={(e) => setEditandoLoteData({...editandoLoteData, nome: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div>
            <div className="mb-6"><label className="block mb-2 font-medium text-sm">Data de Início</label><input type="date" value={editandoLoteData.data_inicio} onChange={(e) => setEditandoLoteData({...editandoLoteData, data_inicio: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div>
            <div className="flex gap-3"><button onClick={() => setShowEditarLote(false)} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleEditarLote} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Novo Lançamento */}
      {showNewLancamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-6">💳 Novo Lançamento</h3>
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Tipo</label><div className="grid grid-cols-3 gap-2">{['saida', 'aporte', 'entrada', 'infraestrutura', 'dividendo'].map(t => (<button key={t} onClick={() => setNovoLancamento({...novoLancamento, tipo: t, categoria: t === 'aporte' ? 'aporte' : t === 'infraestrutura' ? 'infraestrutura' : t === 'dividendo' ? 'dividendo' : '', subcategoria: ''})} className={`px-3 py-3 rounded-xl border-2 text-sm font-medium active:scale-[0.98] ${novoLancamento.tipo === t ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200'}`}>{t === 'saida' ? '📤 Saída' : t === 'aporte' ? '📥 Aporte' : t === 'infraestrutura' ? '🔧 Infra' : t === 'dividendo' ? '💸 Dividendo' : '💰 Entrada'}</button>))}</div></div>
            {novoLancamento.tipo === 'aporte' && (
              <div className="mb-5"><label className="block mb-2 font-medium text-sm">Tipo de Aporte</label><div className="flex gap-2">
                <button onClick={() => setNovoLancamento({...novoLancamento, subcategoria: 'aporte_inicial'})} className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm ${novoLancamento.subcategoria === 'aporte_inicial' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>Aporte Inicial</button>
                <button onClick={() => setNovoLancamento({...novoLancamento, subcategoria: 'aporte_adicional'})} className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm ${novoLancamento.subcategoria === 'aporte_adicional' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>Aporte Adicional</button>
              </div></div>
            )}
            {novoLancamento.tipo === 'saida' && (
              <div className="mb-5"><label className="block mb-2 font-medium text-sm">Categoria</label><select value={novoLancamento.categoria} onChange={(e) => setNovoLancamento({...novoLancamento, categoria: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base"><option value="">Selecione...</option><option value="compra_gado">Compra Gado</option><option value="racao">Ração</option><option value="medicamento">Medicamento</option><option value="frete">Frete</option><option value="outros">Outros</option></select></div>
            )}
            {novoLancamento.tipo === 'entrada' && (
              <div className="mb-5"><label className="block mb-2 font-medium text-sm">Categoria</label><select value={novoLancamento.categoria} onChange={(e) => setNovoLancamento({...novoLancamento, categoria: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base"><option value="">Selecione...</option><option value="venda_gado">Venda Gado</option><option value="outros">Outros</option></select></div>
            )}
            {(novoLancamento.tipo === 'aporte' || novoLancamento.tipo === 'dividendo') && <div className="mb-5"><label className="block mb-2 font-medium text-sm">Sócio *</label><select value={novoLancamento.socio_id} onChange={(e) => setNovoLancamento({...novoLancamento, socio_id: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base"><option value="">Selecione o sócio...</option>{socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>}
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Descrição {novoLancamento.tipo !== 'aporte' && '(opcional)'}</label><input type="text" value={novoLancamento.descricao} onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})} placeholder={novoLancamento.tipo === 'aporte' ? "Ex: referente a compra do boi X" : "Ex: 5 sacos de ração"} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5"><div><label className="block mb-2 font-medium text-sm">Valor (R$)</label><input type="number" inputMode="decimal" value={novoLancamento.valor} onChange={(e) => setNovoLancamento({...novoLancamento, valor: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div><div><label className="block mb-2 font-medium text-sm">Data</label><input type="date" value={novoLancamento.data} onChange={(e) => setNovoLancamento({...novoLancamento, data: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div></div>
            <div className="flex gap-3"><button onClick={() => setShowNewLancamento(false)} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSaveLancamento} className="flex-1 py-3 md:py-4 bg-green-900 text-white rounded-xl font-semibold active:bg-green-800">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Editar Lançamento */}
      {showEditLancamento && editandoLancamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h3 className="text-xl font-bold mb-6">✏️ Editar Lançamento</h3>
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Tipo</label><div className="grid grid-cols-3 gap-2">{['saida', 'aporte', 'entrada', 'infraestrutura', 'dividendo'].map(t => (<button key={t} onClick={() => setEditandoLancamento({...editandoLancamento, tipo: t})} className={`px-3 py-3 rounded-xl border-2 text-sm font-medium active:scale-[0.98] ${editandoLancamento.tipo === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>{t === 'saida' ? '📤 Saída' : t === 'aporte' ? '📥 Aporte' : t === 'infraestrutura' ? '🔧 Infra' : t === 'dividendo' ? '💸 Dividendo' : '💰 Entrada'}</button>))}</div></div>
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Categoria</label><select value={editandoLancamento.categoria} onChange={(e) => setEditandoLancamento({...editandoLancamento, categoria: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base"><option value="">Selecione...</option><option value="compra_gado">Compra Gado</option><option value="venda_gado">Venda Gado</option><option value="racao">Ração</option><option value="medicamento">Medicamento</option><option value="frete">Frete</option><option value="aporte">Aporte</option><option value="infraestrutura">Infraestrutura</option><option value="dividendo">Dividendo</option><option value="outros">Outros</option></select></div>
            {(editandoLancamento.tipo === 'aporte' || editandoLancamento.tipo === 'dividendo') && <div className="mb-5"><label className="block mb-2 font-medium text-sm">Sócio</label><select value={editandoLancamento.socio_id || ''} onChange={(e) => setEditandoLancamento({...editandoLancamento, socio_id: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base"><option value="">Selecione...</option>{socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>}
            <div className="mb-5"><label className="block mb-2 font-medium text-sm">Descrição</label><input type="text" value={editandoLancamento.descricao || ''} onChange={(e) => setEditandoLancamento({...editandoLancamento, descricao: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5"><div><label className="block mb-2 font-medium text-sm">Valor (R$)</label><input type="number" inputMode="decimal" value={editandoLancamento.valor} onChange={(e) => setEditandoLancamento({...editandoLancamento, valor: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div><div><label className="block mb-2 font-medium text-sm">Data</label><input type="date" value={editandoLancamento.data} onChange={(e) => setEditandoLancamento({...editandoLancamento, data: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /></div></div>
            <div className="flex gap-3"><button onClick={() => { setShowEditLancamento(false); setEditandoLancamento(null) }} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSaveEditLancamento} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Novo Animal */}
      {showNewAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-auto">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white"><h2 className="text-lg md:text-xl font-bold">🐄 Novo Animal</h2><button onClick={() => setShowNewAnimal(false)} className="w-9 h-9 bg-gray-100 rounded-full text-lg active:bg-gray-200">✕</button></div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Nome *</label><input type="text" value={novoAnimal.nome} onChange={(e) => setNovoAnimal({...novoAnimal, nome: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Apelido</label><input type="text" value={novoAnimal.apelido} onChange={(e) => setNovoAnimal({...novoAnimal, apelido: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Brinco</label><input type="text" value={novoAnimal.brinco} onChange={(e) => setNovoAnimal({...novoAnimal, brinco: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Raça</label><select value={novoAnimal.raca} onChange={(e) => setNovoAnimal({...novoAnimal, raca: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base"><option>Nelore</option><option>Angus</option><option>Brahman</option><option>Gir</option><option>Mestiço</option></select></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Sexo</label><select value={novoAnimal.sexo} onChange={(e) => setNovoAnimal({...novoAnimal, sexo: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base"><option>Fêmea</option><option>Macho</option><option>Macho Castrado</option></select></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Data Compra *</label><input type="date" value={novoAnimal.data_compra} onChange={(e) => setNovoAnimal({...novoAnimal, data_compra: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 md:p-5 mb-4">
                <h4 className="font-semibold text-green-900 text-sm mb-3 md:mb-4">⚖️ Arroba e Valor (Boi Vivo - 1@ = 15kg)</h4>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div><label className="block mb-1 text-xs md:text-sm font-medium">Arroba (@) *</label><input type="number" inputMode="decimal" step="0.01" value={novoAnimal.arroba_compra} onChange={(e) => setNovoAnimal({...novoAnimal, arroba_compra: e.target.value})} placeholder="Ex: 14.5" className="w-full p-3 border-2 border-green-200 rounded-lg bg-white text-base" /></div>
                  <div><label className="block mb-1 text-xs md:text-sm font-medium">Peso (kg)</label><input type="text" value={novoAnimal.arroba_compra ? (parseFloat(novoAnimal.arroba_compra) * 15).toFixed(1) + ' kg' : ''} disabled className="w-full p-3 border-2 border-green-200 rounded-lg bg-gray-100 text-base" /></div>
                  <div><label className="block mb-1 text-xs md:text-sm font-medium">Valor (R$) *</label><input type="number" inputMode="decimal" value={novoAnimal.valor_compra} onChange={(e) => setNovoAnimal({...novoAnimal, valor_compra: e.target.value})} className="w-full p-3 border-2 border-green-200 rounded-lg bg-white text-base" /></div>
                </div>
              </div>
              <div className="flex gap-3"><button onClick={() => setShowNewAnimal(false)} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSaveAnimal} className="flex-1 py-3 md:py-4 bg-green-900 text-white rounded-xl font-semibold active:bg-green-800">Salvar</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ficha do Animal */}
      {showAnimalModal && selectedAnimal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-auto">
            <div className="bg-gradient-to-r from-green-900 to-green-700 p-4 md:p-6 text-white sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div className="flex gap-3 md:gap-4 items-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl md:text-4xl">🐄</div>
                  <div><div className="text-xs opacity-80">Brinco: {selectedAnimal.brinco || '-'}</div><h2 className="text-xl md:text-2xl font-bold">{selectedAnimal.nome}</h2><p className="opacity-90 text-sm">"{selectedAnimal.apelido}" • {selectedAnimal.raca}</p></div>
                </div>
                <button onClick={() => setShowAnimalModal(false)} className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-full text-lg md:text-xl active:bg-white/30">✕</button>
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-green-50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-green-600 mb-1 font-medium">@ COMPRA (VIVO)</div><div className="text-lg md:text-2xl font-bold text-green-900">{selectedAnimal.arroba_compra} @</div><div className="text-xs text-gray-500">{selectedAnimal.peso_compra} kg</div></div>
                <div className="bg-blue-50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-blue-600 mb-1 font-medium">@ ATUAL (VIVO)</div><div className="text-lg md:text-2xl font-bold text-blue-900">{selectedAnimal.arroba_atual} @</div><div className="text-xs text-blue-500">{selectedAnimal.peso_atual} kg</div></div>
                <div className="bg-orange-50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-orange-600 mb-1 font-medium">GANHO @</div><div className="text-lg md:text-2xl font-bold text-orange-600">+{((parseFloat(selectedAnimal.arroba_atual) || 0) - (parseFloat(selectedAnimal.arroba_compra) || 0)).toFixed(2)} @</div></div>
                <div className="bg-purple-50 rounded-xl md:rounded-2xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-purple-600 mb-1 font-medium">GMD</div><div className="text-lg md:text-2xl font-bold text-purple-900">{(() => { const g = ((parseFloat(selectedAnimal.arroba_atual) || 0) - (parseFloat(selectedAnimal.arroba_compra) || 0)) * ARROBA_VIVO; const d = calcularDiasLote(loteAtual?.data_inicio); return d > 0 ? (g / d).toFixed(3) : '0.000' })()} kg/dia</div></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h3 className="font-semibold text-green-900 text-sm md:text-base">📋 Informações</h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditAnimal(selectedAnimal)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium active:bg-blue-200">✏️ Editar</button>
                      <button onClick={() => handleDeleteAnimal(selectedAnimal.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium active:bg-red-200">🗑️ Excluir</button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 md:p-5 space-y-2 md:space-y-3 text-xs md:text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Brinco</span><span className="font-medium">{selectedAnimal.brinco || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Raça</span><span className="font-medium">{selectedAnimal.raca}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Sexo</span><span className="font-medium">{selectedAnimal.sexo}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Data Compra</span><span className="font-medium">{formatDate(selectedAnimal.data_compra)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Valor Compra</span><span className="font-medium">{formatMoney(selectedAnimal.valor_compra)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">R$ por @</span><span className="font-medium">{formatMoney(selectedAnimal.valor_compra / selectedAnimal.arroba_compra)}</span></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3 md:mb-4"><h3 className="font-semibold text-green-900 text-sm md:text-base">⚖️ Pesagens (@ Vivo)</h3>{selectedAnimal.status === 'ativo' && <button onClick={() => setShowAddPesagem(true)} className="px-3 py-2 bg-green-900 text-white rounded-lg text-xs md:text-sm font-medium active:bg-green-800">+ Nova</button>}</div>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-4 p-2 md:p-3 bg-gray-50 text-[10px] md:text-xs font-semibold text-gray-500 sticky top-0"><div>DATA</div><div>@</div><div>OBS</div><div>AÇÕES</div></div>
                    {getPesagensAnimal(selectedAnimal.id).map((p, idx) => (
                      <div key={idx} className="grid grid-cols-4 p-2 md:p-3 border-t border-gray-100 text-xs md:text-sm items-center">
                        <div className="text-[10px] md:text-xs">{formatDate(p.data)}</div>
                        <div className="font-semibold text-xs md:text-sm">{p.arroba} @</div>
                        <div className="text-gray-500 truncate text-[10px] md:text-xs">{p.observacao || '-'}</div>
                        <div className="flex gap-1"><button onClick={() => handleEditPesagem(p)} className="p-1 text-blue-600 active:bg-blue-50 rounded">✏️</button><button onClick={() => handleDeletePesagem(p.id)} className="p-1 text-red-600 active:bg-red-50 rounded">🗑️</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {selectedAnimal.status === 'ativo' ? (
                <div className="mt-6 p-4 md:p-5 bg-yellow-50 rounded-xl border-2 border-dashed border-yellow-400">
                  <h4 className="font-semibold text-yellow-700 mb-3 md:mb-4 text-sm md:text-base">🏷️ Registrar Venda (@ Morto - 1@ = 30kg)</h4>
                  <form onSubmit={(e) => { e.preventDefault(); handleVendaAnimal(selectedAnimal.id, e.target.arrobaVenda.value, e.target.valorVenda.value, e.target.dataVenda.value) }} className="flex flex-col md:flex-row flex-wrap gap-3">
                    <input name="arrobaVenda" type="number" inputMode="decimal" step="0.01" placeholder="Arroba (@)" required className="p-3 border border-gray-200 rounded-lg flex-1 min-w-[100px] text-base" />
                    <input name="valorVenda" type="number" inputMode="decimal" step="0.01" placeholder="Valor (R$)" required className="p-3 border border-gray-200 rounded-lg flex-1 min-w-[100px] text-base" />
                    <input name="dataVenda" type="date" required className="p-3 border border-gray-200 rounded-lg text-base" />
                    <button type="submit" className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold active:bg-yellow-600 w-full md:w-auto">Registrar</button>
                  </form>
                </div>
              ) : (
                <div className="mt-6 p-4 md:p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-700 mb-3 md:mb-4 text-sm md:text-base">💰 Dados da Venda (@ Morto)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                    <div><div className="text-[10px] md:text-xs text-gray-500">@ Venda</div><div className="font-bold text-sm md:text-base">{selectedAnimal.arroba_venda} @</div></div>
                    <div><div className="text-[10px] md:text-xs text-gray-500">Valor</div><div className="font-bold text-green-600 text-sm md:text-base">{formatMoney(selectedAnimal.valor_venda)}</div></div>
                    <div><div className="text-[10px] md:text-xs text-gray-500">Data</div><div className="font-bold text-sm md:text-base">{formatDate(selectedAnimal.data_venda)}</div></div>
                    <div><div className="text-[10px] md:text-xs text-gray-500">Resultado</div><div className={`font-bold text-sm md:text-base ${(selectedAnimal.valor_venda - selectedAnimal.valor_compra) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(selectedAnimal.valor_venda - selectedAnimal.valor_compra)}</div></div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-3"><button onClick={() => handleEditVenda(selectedAnimal)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700 w-full md:w-auto">✏️ Editar</button><button onClick={() => handleCancelarVenda(selectedAnimal.id)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium active:bg-red-200 w-full md:w-auto">❌ Cancelar Venda</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Pesagem */}
      {showAddPesagem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">⚖️ Nova Pesagem (@ Vivo)</h3>
            <div className="mb-4"><label className="block mb-2 text-sm font-medium">Data</label><input type="date" value={novaPesagem.data} onChange={(e) => setNovaPesagem({...novaPesagem, data: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="mb-4"><label className="block mb-2 text-sm font-medium">Arroba (@)</label><input type="number" inputMode="decimal" step="0.01" value={novaPesagem.arroba} onChange={(e) => setNovaPesagem({...novaPesagem, arroba: e.target.value})} placeholder="Ex: 15.5" className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /><div className="text-xs text-gray-500 mt-1">= {novaPesagem.arroba ? (parseFloat(novaPesagem.arroba) * 15).toFixed(1) : '0'} kg</div></div>
            <div className="mb-6"><label className="block mb-2 text-sm font-medium">Observação</label><input type="text" value={novaPesagem.observacao} onChange={(e) => setNovaPesagem({...novaPesagem, observacao: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="flex gap-3"><button onClick={() => setShowAddPesagem(false)} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSavePesagem} className="flex-1 py-3 md:py-4 bg-green-900 text-white rounded-xl font-semibold active:bg-green-800">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Editar Pesagem */}
      {showEditPesagem && editandoPesagem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">✏️ Editar Pesagem</h3>
            <div className="mb-4"><label className="block mb-2 text-sm font-medium">Data</label><input type="date" value={editandoPesagem.data} onChange={(e) => setEditandoPesagem({...editandoPesagem, data: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="mb-4"><label className="block mb-2 text-sm font-medium">Arroba (@)</label><input type="number" inputMode="decimal" step="0.01" value={editandoPesagem.arroba} onChange={(e) => setEditandoPesagem({...editandoPesagem, arroba: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="mb-6"><label className="block mb-2 text-sm font-medium">Observação</label><input type="text" value={editandoPesagem.observacao || ''} onChange={(e) => setEditandoPesagem({...editandoPesagem, observacao: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="flex gap-3"><button onClick={() => { setShowEditPesagem(false); setEditandoPesagem(null) }} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSaveEditPesagem} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Editar Animal */}
      {showEditAnimal && editandoAnimal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-xl max-h-[90vh] overflow-auto">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white"><h2 className="text-lg md:text-xl font-bold">✏️ Editar Animal</h2><button onClick={() => { setShowEditAnimal(false); setEditandoAnimal(null) }} className="w-9 h-9 bg-gray-100 rounded-full text-lg active:bg-gray-200">✕</button></div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Nome *</label><input type="text" value={editandoAnimal.nome} onChange={(e) => setEditandoAnimal({...editandoAnimal, nome: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Apelido</label><input type="text" value={editandoAnimal.apelido} onChange={(e) => setEditandoAnimal({...editandoAnimal, apelido: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Brinco</label><input type="text" value={editandoAnimal.brinco} onChange={(e) => setEditandoAnimal({...editandoAnimal, brinco: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Raça</label><select value={editandoAnimal.raca} onChange={(e) => setEditandoAnimal({...editandoAnimal, raca: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base"><option>Nelore</option><option>Angus</option><option>Brahman</option><option>Gir</option><option>Mestiço</option></select></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Sexo</label><select value={editandoAnimal.sexo} onChange={(e) => setEditandoAnimal({...editandoAnimal, sexo: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base"><option>Fêmea</option><option>Macho</option><option>Macho Castrado</option></select></div>
                <div><label className="block mb-1 text-xs md:text-sm font-medium">Data Compra *</label><input type="date" value={editandoAnimal.data_compra} onChange={(e) => setEditandoAnimal({...editandoAnimal, data_compra: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-lg text-base" /></div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 md:p-5 mb-4">
                <h4 className="font-semibold text-green-900 text-sm mb-3 md:mb-4">⚖️ Arroba e Valor de Compra</h4>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <div><label className="block mb-1 text-xs md:text-sm font-medium">Arroba (@) *</label><input type="number" inputMode="decimal" step="0.01" value={editandoAnimal.arroba_compra} onChange={(e) => setEditandoAnimal({...editandoAnimal, arroba_compra: e.target.value})} className="w-full p-3 border-2 border-green-200 rounded-lg bg-white text-base" /></div>
                  <div><label className="block mb-1 text-xs md:text-sm font-medium">Peso (kg)</label><input type="text" value={editandoAnimal.arroba_compra ? (parseFloat(editandoAnimal.arroba_compra) * 15).toFixed(1) + ' kg' : ''} disabled className="w-full p-3 border-2 border-green-200 rounded-lg bg-gray-100 text-base" /></div>
                  <div><label className="block mb-1 text-xs md:text-sm font-medium">Valor (R$) *</label><input type="number" inputMode="decimal" value={editandoAnimal.valor_compra} onChange={(e) => setEditandoAnimal({...editandoAnimal, valor_compra: e.target.value})} className="w-full p-3 border-2 border-green-200 rounded-lg bg-white text-base" /></div>
                </div>
              </div>
              <div className="flex gap-3"><button onClick={() => { setShowEditAnimal(false); setEditandoAnimal(null) }} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSaveEditAnimal} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700">Salvar</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Venda */}
      {showEditVenda && editandoVenda && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">✏️ Editar Venda (@ Morto)</h3>
            <div className="mb-4"><label className="block mb-2 text-sm font-medium">Arroba (@)</label><input type="number" inputMode="decimal" step="0.01" value={editandoVenda.arroba_venda} onChange={(e) => setEditandoVenda({...editandoVenda, arroba_venda: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="mb-4"><label className="block mb-2 text-sm font-medium">Valor (R$)</label><input type="number" inputMode="decimal" step="0.01" value={editandoVenda.valor_venda} onChange={(e) => setEditandoVenda({...editandoVenda, valor_venda: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="mb-6"><label className="block mb-2 text-sm font-medium">Data</label><input type="date" value={editandoVenda.data_venda} onChange={(e) => setEditandoVenda({...editandoVenda, data_venda: e.target.value})} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-lg text-base" /></div>
            <div className="flex gap-3"><button onClick={() => { setShowEditVenda(false); setEditandoVenda(null) }} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleSaveEditVenda} className="flex-1 py-3 md:py-4 bg-blue-600 text-white rounded-xl font-semibold active:bg-blue-700">Salvar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Fechar Lote */}
      {showFecharLote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h3 className="text-xl md:text-2xl font-bold mb-6">🔒 Fechar Lote</h3>
            <div className="bg-green-50 rounded-xl p-4 md:p-5 mb-6">
              <h4 className="font-semibold text-green-900 mb-3 md:mb-4 text-sm md:text-base">Resumo: {loteAtual?.nome}</h4>
              <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div><span className="text-gray-500">Período:</span> <span className="font-medium">{formatDate(loteAtual?.data_inicio)} - {formatDate(dataFechamento)}</span></div>
                <div><span className="text-gray-500">Duração:</span> <span className="font-medium">{calcularDiasLote(loteAtual?.data_inicio, dataFechamento)} dias ({calcularMesesLote(loteAtual?.data_inicio, dataFechamento)} meses)</span></div>
                <div><span className="text-gray-500">Animais:</span> <span className="font-medium">{animais.length}</span></div>
                <div><span className="text-gray-500">Aportes:</span> <span className="font-medium">{formatMoney(indicadores.totalAportes)}</span></div>
              </div>
            </div>
            <div className="mb-5"><label className="block mb-2 font-medium text-sm md:text-base">📅 Data de Fechamento</label><input type="date" value={dataFechamento} onChange={(e) => setDataFechamento(e.target.value)} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl text-base" /><p className="text-xs text-gray-500 mt-2">Informe a data real do encerramento.</p></div>
            <div className="mb-6"><label className="block mb-2 font-medium text-sm md:text-base">📝 Observações do Lote</label><textarea value={observacoesFechamento} onChange={(e) => setObservacoesFechamento(e.target.value)} placeholder="Registre acontecimentos importantes..." rows={4} className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-xl resize-none text-base" /></div>
            <div className="flex gap-3"><button onClick={() => { setShowFecharLote(false); setObservacoesFechamento(''); setDataFechamento(new Date().toISOString().split('T')[0]) }} className="flex-1 py-3 md:py-4 border-2 border-gray-200 rounded-xl font-semibold active:bg-gray-100">Cancelar</button><button onClick={handleFecharLote} className="flex-1 py-3 md:py-4 bg-orange-500 text-white rounded-xl font-semibold active:bg-orange-600">Confirmar</button></div>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do Lote (One-Page) */}
      {showLoteDetalhes && selectedLote && (() => {
        const lote = selectedLote.lote
        const animaisLote = selectedLote.animais || []
        const lancamentosLote = selectedLote.lancamentos || []
        const dias = calcularDiasLote(lote?.data_inicio, lote?.data_fim)
        const meses = (dias / 30).toFixed(1)
        
        // Calcular totais dos lançamentos
        const totalAportes = lancamentosLote.filter(l => l.tipo === 'aporte').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
        const totalVendas = lancamentosLote.filter(l => l.tipo === 'entrada').reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
        const totalCustos = lancamentosLote.filter(l => l.tipo === 'saida').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
        const totalDespesas = lancamentosLote.filter(l => l.tipo === 'infraestrutura').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
        const dividendos = lancamentosLote.filter(l => l.tipo === 'dividendo').reduce((acc, l) => acc + Math.abs(parseFloat(l.valor || 0)), 0)
        const resultadoBruto = totalVendas - totalCustos
        const resultadoLiquido = resultadoBruto - totalDespesas
        const resultadoFinal = resultadoLiquido - dividendos
        
        // Rendimentos (Juros compostos)
        const mesesNum = dias / 30
        // Juros compostos: (((Resultado + Aportes) / Aportes) ^ (1 / Meses)) - 1
        const montanteBruto = resultadoBruto + totalAportes
        const montanteLiquido = resultadoLiquido + totalAportes
        const rendSoCustos = mesesNum > 0 && totalAportes > 0 ? (Math.pow(montanteBruto / totalAportes, 1 / mesesNum) - 1) * 100 : 0
        const rendComDespesas = mesesNum > 0 && totalAportes > 0 ? (Math.pow(montanteLiquido / totalAportes, 1 / mesesNum) - 1) * 100 : 0
        
        // Arrobas - compra é vivo (15kg), venda é morto (30kg)
        const totalArrobaCompra = animaisLote.reduce((a, x) => a + parseFloat(x.arroba_compra || 0), 0)
        const totalArrobaVenda = animaisLote.reduce((a, x) => a + parseFloat(x.arroba_venda || 0), 0)
        const lucroGado = animaisLote.reduce((a, x) => a + (parseFloat(x.valor_venda || 0) - parseFloat(x.valor_compra || 0)), 0)
        
        // URL compartilhável
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/lote/${lote?.id}` : ''
        
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-auto">
              <div className="bg-gradient-to-r from-gray-800 to-gray-600 p-4 md:p-6 text-white sticky top-0 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">LOTE FECHADO</span>
                    <h2 className="text-xl md:text-2xl font-bold mt-2">{lote?.nome}</h2>
                    <p className="opacity-80 text-xs md:text-sm">{formatDate(lote?.data_inicio)} - {formatDate(lote?.data_fim)} • {dias} dias ({meses} meses)</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Link copiado!') }} className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-full text-lg active:bg-white/30" title="Copiar link">🔗</button>
                    <button onClick={() => { setShowLoteDetalhes(false); setSelectedLote(null) }} className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-full text-lg md:text-xl active:bg-white/30">✕</button>
                  </div>
                </div>
              </div>
              <div className="p-4 md:p-6">
                {/* Indicadores principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-blue-600 mb-1">Aportes</div><div className="text-lg md:text-xl font-bold text-blue-900">{formatMoney(totalAportes)}</div></div>
                  <div className="bg-green-50 rounded-xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-green-600 mb-1">Vendas</div><div className="text-lg md:text-xl font-bold text-green-900">{formatMoney(totalVendas)}</div></div>
                  <div className="bg-red-50 rounded-xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-red-600 mb-1">Custos</div><div className="text-lg md:text-xl font-bold text-red-900">{formatMoney(totalCustos)}</div></div>
                  <div className="bg-orange-50 rounded-xl p-3 md:p-4 text-center"><div className="text-[10px] md:text-xs text-orange-600 mb-1">Despesas</div><div className="text-lg md:text-xl font-bold text-orange-900">{formatMoney(totalDespesas)}</div></div>
                </div>
                
                {/* Resultados */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className={`rounded-xl p-4 text-center ${resultadoBruto >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                    <div className="text-xs text-gray-600 mb-1">Resultado Bruto</div>
                    <div className={`text-xl md:text-2xl font-bold ${resultadoBruto >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatMoney(resultadoBruto)}</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${resultadoLiquido >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className="text-xs text-gray-600 mb-1">Resultado Líquido</div>
                    <div className={`text-xl md:text-2xl font-bold ${resultadoLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatMoney(resultadoLiquido)}</div>
                  </div>
                </div>
                
                {/* Dividendos e Saldo Final */}
                {dividendos > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                    <div className="rounded-xl p-4 text-center bg-purple-100">
                      <div className="text-xs text-purple-600 mb-1">Dividendos Distribuídos</div>
                      <div className="text-xl md:text-2xl font-bold text-purple-700">-{formatMoney(dividendos)}</div>
                    </div>
                    <div className={`rounded-xl p-4 text-center ${resultadoFinal >= 0 ? 'bg-gray-100' : 'bg-red-100'}`}>
                      <div className="text-xs text-gray-600 mb-1">Saldo Final</div>
                      <div className={`text-xl md:text-2xl font-bold ${resultadoFinal >= 0 ? 'text-gray-700' : 'text-red-700'}`}>{formatMoney(resultadoFinal)}</div>
                    </div>
                  </div>
                )}
                
                {/* Rendimento */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 md:p-5 mb-6">
                  <h3 className="font-semibold text-purple-800 mb-3 text-sm md:text-base">📈 Rendimento dos Aportes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Só Custos</div>
                      <div className={`text-2xl md:text-3xl font-bold ${rendSoCustos >= 0 ? 'text-purple-700' : 'text-red-600'}`}>{rendSoCustos.toFixed(2)}%</div>
                      <div className="text-xs text-gray-500">ao mês</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-600 mb-1">Com Despesas</div>
                      <div className={`text-2xl md:text-3xl font-bold ${rendComDespesas >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>{rendComDespesas.toFixed(2)}%</div>
                      <div className="text-xs text-gray-500">ao mês</div>
                    </div>
                  </div>
                </div>

                {/* Animais */}
                <div className="bg-white border rounded-xl p-4 md:p-5 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3 md:mb-4 text-sm md:text-base">🐄 Animais ({animaisLote.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
                    <div><div className="text-[10px] md:text-xs text-gray-500">@ Compra (Vivo)</div><div className="text-lg md:text-xl font-bold">{totalArrobaCompra.toFixed(2)} @</div></div>
                    <div><div className="text-[10px] md:text-xs text-gray-500">@ Venda (Morto)</div><div className="text-lg md:text-xl font-bold">{totalArrobaVenda.toFixed(2)} @</div></div>
                    <div><div className="text-[10px] md:text-xs text-gray-500">Rend. Carcaça</div><div className="text-lg md:text-xl font-bold text-blue-600">{totalArrobaCompra > 0 ? ((totalArrobaVenda / totalArrobaCompra) * 100).toFixed(1) : 0}%</div></div>
                    <div><div className="text-[10px] md:text-xs text-gray-500">Lucro Gado</div><div className="text-lg md:text-xl font-bold text-green-600">{formatMoney(lucroGado)}</div></div>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {animaisLote.map(a => (
                      <div key={a.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-2 bg-gray-50 rounded-lg text-xs md:text-sm gap-1">
                        <span className="font-medium">{a.nome}</span>
                        <div className="flex gap-2 md:gap-4 text-[10px] md:text-xs">
                          <span>Compra: {formatMoney(a.valor_compra)}</span>
                          <span>Venda: {formatMoney(a.valor_venda)}</span>
                          <span className={`font-medium ${(a.valor_venda - a.valor_compra) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(a.valor_venda - a.valor_compra)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-5">
                  <h3 className="font-semibold text-yellow-800 mb-3 text-sm md:text-base">📝 Observações</h3>
                  <textarea 
                    value={selectedLote.lote?.observacoes || ''} 
                    onChange={(e) => setSelectedLote({...selectedLote, lote: {...selectedLote.lote, observacoes: e.target.value}})} 
                    placeholder="Adicione observações sobre o lote..." 
                    rows={4} 
                    className="w-full p-3 border border-yellow-300 rounded-lg bg-white resize-none text-base" 
                  />
                  <button 
                    onClick={() => handleSaveObservacoesLote(selectedLote.lote.id, selectedLote.lote?.observacoes || '')} 
                    className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium active:bg-yellow-600"
                  >
                    💾 Salvar Observações
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
