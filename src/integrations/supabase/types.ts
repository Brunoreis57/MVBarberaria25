export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          barbeiro_id: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at: string | null
          data: string
          hora: string
          id: string
          servico_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          barbeiro_id?: string | null
          cliente_nome: string
          cliente_telefone: string
          created_at?: string | null
          data: string
          hora: string
          id?: string
          servico_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          barbeiro_id?: string | null
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string | null
          data?: string
          hora?: string
          id?: string
          servico_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes_caixa_barbeiro: {
        Row: {
          barbeiro_id: string | null
          created_at: string | null
          criado_por: string | null
          data_ajuste: string
          descricao: string
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          barbeiro_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_ajuste?: string
          descricao: string
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          barbeiro_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_ajuste?: string
          descricao?: string
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_caixa_barbeiro_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_planos: {
        Row: {
          cliente_nome: string
          cliente_telefone: string
          cortes_totais: number
          cortes_utilizados: number | null
          created_at: string | null
          data_fim: string
          data_inicio: string
          forma_pagamento: string
          id: string
          pago: boolean | null
          plano_id: string | null
          updated_at: string | null
          valor_pago: number
        }
        Insert: {
          cliente_nome: string
          cliente_telefone: string
          cortes_totais: number
          cortes_utilizados?: number | null
          created_at?: string | null
          data_fim: string
          data_inicio: string
          forma_pagamento: string
          id?: string
          pago?: boolean | null
          plano_id?: string | null
          updated_at?: string | null
          valor_pago: number
        }
        Update: {
          cliente_nome?: string
          cliente_telefone?: string
          cortes_totais?: number
          cortes_utilizados?: number | null
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          forma_pagamento?: string
          id?: string
          pago?: boolean | null
          plano_id?: string | null
          updated_at?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos: {
        Row: {
          barbeiro_id: string | null
          cliente_nome: string
          created_at: string | null
          data_atendimento: string | null
          desconto_tipo: string | null
          desconto_valor: number | null
          forma_pagamento: string | null
          id: string
          pago: boolean | null
          servico_id: string | null
          valor: number
        }
        Insert: {
          barbeiro_id?: string | null
          cliente_nome: string
          created_at?: string | null
          data_atendimento?: string | null
          desconto_tipo?: string | null
          desconto_valor?: number | null
          forma_pagamento?: string | null
          id?: string
          pago?: boolean | null
          servico_id?: string | null
          valor: number
        }
        Update: {
          barbeiro_id?: string | null
          cliente_nome?: string
          created_at?: string | null
          data_atendimento?: string | null
          desconto_tipo?: string | null
          desconto_valor?: number | null
          forma_pagamento?: string | null
          id?: string
          pago?: boolean | null
          servico_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      barbeiros: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          porcentagem_comissao: number | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          porcentagem_comissao?: number | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          porcentagem_comissao?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string | null
          data_aniversario: string | null
          email: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_aniversario?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_aniversario?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string | null
          id: string
          updated_at: string | null
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string
          descricao: string
          id: string
          lida: boolean
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          lida?: boolean
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          lida?: boolean
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          atendimento_id: string | null
          created_at: string | null
          data_pagamento: string | null
          descricao: string | null
          id: string
          metodo_pagamento: string
          tipo: string | null
          valor: number
        }
        Insert: {
          atendimento_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          metodo_pagamento: string
          tipo?: string | null
          valor: number
        }
        Update: {
          atendimento_id?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          id?: string
          metodo_pagamento?: string
          tipo?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          quantidade_cortes: number
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          quantidade_cortes: number
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          quantidade_cortes?: number
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          id: string
          nome: string
          porcentagem_comissao: number | null
          preco_custo: number | null
          preco_venda: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          porcentagem_comissao?: number | null
          preco_custo?: number | null
          preco_venda: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          porcentagem_comissao?: number | null
          preco_custo?: number | null
          preco_venda?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      retiradas: {
        Row: {
          aprovado: boolean | null
          barbeiro_id: string | null
          created_at: string | null
          data_retirada: string | null
          id: string
          motivo: string
          pessoa: string
          valor: number
        }
        Insert: {
          aprovado?: boolean | null
          barbeiro_id?: string | null
          created_at?: string | null
          data_retirada?: string | null
          id?: string
          motivo: string
          pessoa: string
          valor: number
        }
        Update: {
          aprovado?: boolean | null
          barbeiro_id?: string | null
          created_at?: string | null
          data_retirada?: string | null
          id?: string
          motivo?: string
          pessoa?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "retiradas_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          duracao_minutos: number | null
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          nome: string
          preco: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas_produtos: {
        Row: {
          barbeiro_id: string | null
          created_at: string
          data_venda: string
          forma_pagamento: string
          id: string
          produto_id: string
          quantidade: number
          valor_comissao: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          barbeiro_id?: string | null
          created_at?: string
          data_venda?: string
          forma_pagamento: string
          id?: string
          produto_id: string
          quantidade?: number
          valor_comissao?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          barbeiro_id?: string | null
          created_at?: string
          data_venda?: string
          forma_pagamento?: string
          id?: string
          produto_id?: string
          quantidade?: number
          valor_comissao?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_produtos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "barber"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "barber"],
    },
  },
} as const
