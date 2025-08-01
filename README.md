# 🏦 Sistema de Integração com Bancos - Criação e Desbloqueio de Usuários

## 📌 Bancos Disponíveis

- **C6**
- **QueroMais**
- **PAN**
- **BMG**

---

## ✅ Regras Gerais

### 🔓 Desbloqueio de Usuário
Antes de realizar um desbloqueio, **verifique no Jarvis** se o usuário solicitado pertence ao **mesmo corretor** que abriu o chamado.

### 👤 Criação de Usuário
Antes de criar um novo usuário, é necessário:

- Verificar **débitos na ANEC** (via Jarvis).
- Validar **certificados do corretor** (feita automaticamente pelo robô).
  - O robô utiliza **MySQL** e pode ser iniciado via **Docker**.
- **Banco PAN**: é necessário **RG/CNH** e **contrato assinado** (a validação ainda será implementada, mas os arquivos devem ser enviados ao robô).

---

## 🔗 Endpoints

### ➕ Criar Usuário

```
POST http://localhost:3050/api/create_user_bank/:banco
```

### 🔓 Desbloquear Usuário

```
POST http://localhost:3050/api/unlock_user_bank
```

---

## 📤 Payloads de Desbloqueio

### Banco **QueroMais**
```json
{
  "cpf": "90033710163",
  "name": "RITA DE CACIA RODRIGUES NASCIMENTO",
  "bank": "queromais"
}
```

### Banco **PAN**
```json
{
  "cpf": "08831205692",
  "name": "NAGIMA URSINO PACHECO",
  "bank": "pan",
  "state_acronym": "MG"
}
```

### Banco **BMG**
```json
{
  "user": "WARLEI1201BH2",
  "cpf": "095.405.526-80",
  "bank": "bmg"
}
```

---

## 📥 Retorno de Desbloqueio

### 🔄 Padrão de Retorno
```json
{
  "status": true,
  "response": "Usuário desbloqueado e senha resetada com sucesso.",
  "data": {
    "user": "LOGIN",
    "pass": "NovaSenha"
  }
}
```

---

## 📥 Resposta da Criação de Usuário

### Banco **QueroMais**
```json
{
  "status": true,
  "response": "Data successfully processed",
  "data": {
    "user_data": {
      "user": "24445951650_900043",
      "login": "244459516-50",
      "password": "%Ub1dU"
    },
   "certificates": [
    {
      "id": 1,
      "user_id": 1,
      "certifier": "FEBRABAN",
      "certificate_type": "6273",
      "category": null,
      "name": "FBB110 Correspondente Consignado",
      "number": "3427382759474667",
      "exam_date": "2023-06-12",
      "valid_until": "2026-06-12",
      "status": "Ativo",
      "created_at": "2025-07-31T20:01:58.000Z",
      "updated_at": "2025-07-31T20:01:58.000Z",
      "user": {
        "id": 1,
        "cpf": "095.405.526-80",
        "name": "Igor Marcal",
        "created_at": "2025-07-31T20:01:58.000Z",
        "updated_at": "2025-07-31T20:01:58.000Z"
      }
    }
  ]
  }
}
```

### Banco **PAN**
```json
{
  "status": true,
  "response": "Data successfully processed",
  "data": {
    "user_data": {
      "login": "24445951650_900043",
      "password": "%Ub1dU"
    },
    "certificates": [ ... ]
  }
}
```

### Banco **BMG**
```json
{
  "status": true,
  "response": "Data successfully processed",
  "data": {
    "user_data": {
      "login": "WARLEI1201MG6",
      "cpf": "13139603657",
      "name": "Warlei Junio",
      "birth_date": "27/09/2002",
      "mothers_name": "Zulma Marcal",
      "phone": "329888688440",
      "user": "WARLEI1201MG6",
      "password": "%Ub1dU"
    },
    "certificates": [ ... ]
  }
}
```

---

## 📝 Observações Finais

- Certifique-se de validar todos os dados antes de qualquer operação.
- Lembre-se: o robô utiliza **MySQL** e pode ser iniciado via **Docker** para teste e consulta de certificados.
- Os certificados retornados seguem o padrão FEBRABAN com situação ativa.

---