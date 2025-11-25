import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BarbeiroStats {
  barbeiro_id: string
  nome: string
  total_comissao: number
  total_retiradas: number
  total_ajustes: number
  saldo: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Iniciando fechamento de mês dos barbeiros...')

    // Buscar todos os barbeiros ativos
    const { data: barbeiros, error: barbeirosError } = await supabase
      .from('barbeiros')
      .select('id, nome')
      .eq('ativo', true)

    if (barbeirosError) {
      console.error('Erro ao buscar barbeiros:', barbeirosError)
      throw barbeirosError
    }

    if (!barbeiros || barbeiros.length === 0) {
      console.log('Nenhum barbeiro ativo encontrado')
      return new Response(
        JSON.stringify({ message: 'Nenhum barbeiro ativo encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const dataFechamento = new Date().toISOString()
    const mesReferencia = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const saldosBarbeiros = []

    // Processar cada barbeiro
    for (const barbeiro of barbeiros) {
      console.log(`Processando barbeiro: ${barbeiro.nome}`)

      // Calcular estatísticas do barbeiro
      const { data: atendimentos } = await supabase
        .from('atendimentos')
        .select('valor, forma_pagamento')
        .eq('barbeiro_id', barbeiro.id)
        .eq('pago', true)

      const { data: vendas } = await supabase
        .from('vendas_produtos')
        .select('valor_comissao')
        .eq('barbeiro_id', barbeiro.id)

      const { data: retiradas } = await supabase
        .from('retiradas')
        .select('valor')
        .eq('barbeiro_id', barbeiro.id)
        .eq('aprovado', true)

      const { data: ajustes } = await supabase
        .from('ajustes_caixa_barbeiro')
        .select('valor, tipo')
        .eq('barbeiro_id', barbeiro.id)

      // Calcular totais
      const totalComissao = (atendimentos || []).reduce((sum, a) => sum + (Number(a.valor) * 0.5), 0) +
                           (vendas || []).reduce((sum, v) => sum + Number(v.valor_comissao), 0)
      
      const totalRetiradas = (retiradas || []).reduce((sum, r) => sum + Number(r.valor), 0)
      
      const totalAjustes = (ajustes || []).reduce((sum, a) => {
        return sum + (a.tipo === 'adicao' ? Number(a.valor) : -Number(a.valor))
      }, 0)

      const saldo = totalComissao - totalRetiradas + totalAjustes

      console.log(`${barbeiro.nome} - Saldo mantido para próximo mês: R$ ${saldo.toFixed(2)}`)

      saldosBarbeiros.push({
        barbeiro: barbeiro.nome,
        saldo: saldo
      })
    }

    const resultado = {
      message: 'Fechamento de mês registrado - Saldos mantidos para o próximo mês',
      data_fechamento: dataFechamento,
      mes_referencia: mesReferencia,
      barbeiros_processados: barbeiros.length,
      saldos: saldosBarbeiros
    }

    console.log('Fechamento concluído:', resultado)

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erro no fechamento de mês:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
