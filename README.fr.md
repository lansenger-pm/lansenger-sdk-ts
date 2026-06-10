[English](README.md) | [简体中文](README.zhHans.md) | [繁体中文](README.zhHant.md) | [繁体中文香港](README.zhHantHK.md) | [Français](README.fr.md)

# lansenger-sdk-ts

SDK TypeScript indépendant du framework pour la plateforme Lansenger (蓝信) — prend en charge les applications Lansenger, les bots d'organisation et les bots personnels.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript 5+](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-green)](https://nodejs.org/)

> Zéro dépendance de framework — uniquement `node-fetch` (v2, compatible CommonJS). Fonctionne avec tout projet Node.js.

## Types de bots pris en charge

| Type de bot | Auth | WebSocket entrant | Toutes les API |
|-------------|------|-------------------|----------------|
| **Application Lansenger** | appToken + userToken | ✗ (utilise webhook) | ✓ |
| **Bot d'organisation** | appToken + userToken | ✗ (utilise webhook) | ✓ |
| **Bot personnel** | appToken | ✓ (WebSocket) | ✓ (limité pour les API non-bot) |

Les trois types de bots utilisent le même mécanisme d'authentification : `appToken` est requis pour chaque appel API ; `userToken` est uniquement nécessaire pour certaines opérations au niveau utilisateur (infos utilisateur, recherche de staff, calendrier, etc.).

## Fonctionnalités

- **Client async** — `LansengerClient` fournit une API basée sur des Promesses
- **Persistance des identifiants & tokens** — `CredentialStore` sauvegarde app_id, app_secret, URLs, appToken, userToken dans un fichier (survit aux redémarrages)
- **Authentification utilisateur OAuth2** — URL d'autorisation, échange de code, refresh de token
- **Organisation & départements** — infos org, détail/children/staff de département
- **Staff & contacts** — infos basiques/détaillées, mapping d'ID, ancêtres de département, recherche
- **Messagerie** — 3 canaux de chat privé (bot, compte officiel, impersonnation utilisateur) + chat de groupe, tous les types de messages, @mention, identité humain/bot, rappels urgents
- **Cartes riches** — appCard (avec mises à jour dynamiques), oacard, linkCard, appArticles
- **Messages en streaming** — delivery en temps réel basé sur SSE pour les agents IA
- **Upload/download de médias** — fichiers, images, vidéos avec detection automatique du type, récupération du chemin média
- **Gestion des messages** — révocation, mise à jour dynamique de carte
- **Groups** — créer, infos, membres, liste, vérification de membership, mise à jour des paramètres & membres, dissoudre
- **Calendrier & Schedule** — calendrier principal, CRUD de schedule + mise à jour, gestion des participants + métadonnées participants
- **Todo unifié** — créer, mettre à jour, supprimer, interroger, gestion d'exécuteur, comptes de statut
- **Événements de callback** — 25 types d'événements, parsing structuré, décryptage AES (spec 4.10.1.4), vérification de signature SHA1
- **Lecture de chats** — liste de chats, messages de chat (4.24 MCP)

## Installation rapide

```bash
npm install lansenger-sdk-ts
```

Pour le développement :

```bash
git clone https://github.com/lansenger-pm/lansenger-sdk-ts.git
cd lansenger-sdk-ts
npm install
npm run build
npm test
```

## 1. Authentification

### appToken — Requis pour tous les appels API

Chaque méthode du SDK requiert `appToken`. Le client l'obtient et le refresh automatiquement à partir de votre `app_id` + `app_secret` via `GET /v1/apptoken/create`. Vous n'avez jamais besoin de gérer appToken manuellement — le `TokenManager` gère le cycle de vie :

1. **Premier appel** → `GET /v1/apptoken/create` avec app_id + app_secret → renvoie `appToken` (valide 2 heures)
2. **Appels suivants** → réutilise le appToken en cache jusqu'à expiration
3. **Token expiré** → refresh automatique via le même endpoint

```typescript
import { LansengerClient } from "lansenger-sdk-ts";

const client = new LansengerClient("your-appid", "your-secret");

// Vous pouvez aussi obtenir/invalider le token manuellement
const token = await client.getToken();
client.invalidateToken(); // force le refresh au prochain appel
```

### userToken — Uniquement nécessaire pour certains endpoints

`userToken` représente l'autorisation d'un utilisateur Lansenger spécifique (obtenu via OAuth2). Il est uniquement requis pour :
- Informations au niveau utilisateur (fetchUserInfo, fetchStaffDetail, searchStaff)
- Opérations de calendrier & schedule (fetchPrimaryCalendar, createSchedule, etc.)
- Opérations de groupe comme envoyeur humain

### Obtenir les identifiants

| Type de bot | Comment obtenir app_id + app_secret |
|-------------|--------------------------------------|
| **Bot personnel** | Client Lansenger (desktop) → Contacts → Bots intelligents → Bots personnels → cliquer sur l'icône ℹ️ (le client mobile ne permet pas de voir les identifiants) |
| **Application Lansenger** | Créer sur le Lansenger Developer Center — peut nécessiter l'approbation de l'administrateur de l'organisation |
| **Bot d'organisation** | Créer sur le Lansenger Developer Center — peut nécessiter l'approbation de l'administrateur de l'organisation |

### Authentification OAuth2 niveau utilisateur

```typescript
// Construire l'URL d'autorisation — rediriger l'utilisateur vers Lansenger passport
const url = client.buildAuthorizeUrl("https://myapp.com/callback");

// Après autorisation de l'utilisateur, échanger le code pour userToken + refreshToken
const tokenResult = await client.exchangeCode("auth_code_from_callback");

// Refresh un userToken expiré
const newToken = await client.refreshUserToken(tokenResult.refresh_token!);

// Récupérer le profil utilisateur
const userInfo = await client.fetchUserInfo(tokenResult.user_token!);
```

### Méthodes factory

```typescript
// Depuis les variables d'environnement (LANSENGER_APP_ID, LANSENGER_APP_SECRET, etc.)
const client = LansengerClient.fromEnv();

// Depuis un objet LansengerConfig
const config = new LansengerConfig("appid", "secret", "https://open.e.lanxin.cn/open/apigw");
const client = LansengerClient.fromConfig(config);

// Depuis CredentialStore (lecture des identifiants persistés)
const client = LansengerClient.fromStore();
```

## 2. Organisation & Départements

```typescript
// Infos organisation
const org = await client.fetchOrgInfo("orgId");

// Hiérarchie des départements
const detail = await client.fetchDepartmentDetail("deptId");
const children = await client.fetchDepartmentChildren("deptId");
const staffs = await client.fetchDepartmentStaffs("deptId");
```

## 3. Staff & Contacts

```typescript
// Infos basiques du staff
const staff = await client.fetchStaffBasicInfo("staffOpenId");

// Profil détaillé (userToken recommandé)
const detail = await client.fetchStaffDetail("staffOpenId", { user_token: "ut" });

// Mapper téléphone → staffId
const mapping = await client.fetchStaffIdMapping("orgId", "mobile", "13800138000");

// Ancêtres de département pour un membre du staff
const ancestors = await client.fetchDepartmentAncestors("staffOpenId");

// Rechercher du staff (requiert userToken)
const results = await client.searchStaff("Zhang San", { user_token: "ut" });

// IDs de champs extra de l'org
const fields = await client.fetchOrgExtraFieldIds("orgId");
```

## 4. Messagerie & Médias

#### Chat privé de bot — le plus courant

```typescript
const result = await client.sendText("staff123", "Bonjour !");
const result = await client.sendMarkdown("staff123", "**Gras**");
const result = await client.sendFile("staff123", "/path/to/report.pdf");
```

#### Canal compte officiel

```typescript
const result = await client.sendAccountMessage(
  "text", { text: { content: "Notice système" } },
  ["staff1", "staff2"], undefined,
  { account_id: "524288-xxxx" },
);
```

#### Canal impersonnation utilisateur (requiert userToken)

```typescript
const result = await client.sendUserMessage(
  "staff456", "text", { text: { content: "Bonjour" } },
  { user_token: "ut" },
);
```

#### Chat de groupe

```typescript
// Bot → groupe
const result = await client.sendText("group123", "Notice", { is_group: true });

// Humain → groupe (avec userToken)
const result = await client.sendGroupMessage(
  "group123", "text", { text: { content: "Je vais le traiter" } },
  { user_token: "ut" },
);

// @mention dans un groupe
const result = await client.sendText("group123", "Important !", { is_group: true, reminder_all: true });
```

#### Cartes enrichies

```typescript
const result = await client.sendAppCard("staff123", "Approbation", { is_dynamic: true });
const result = await client.sendLinkCard("staff123", "Article", "https://...");
const result = await client.sendAppArticles("staff123", [{ title: "Article 1", link: "..." }]);

// Mettre à jour le statut d'une carte dynamique
const result = await client.updateDynamicCard("msg123", { is_last_update: true });
```

#### Messages en streaming (pour agents IA)

```typescript
const result = await client.createStreamMessage("staff1", "staff", "stream-id-1");
const result = await client.fetchStreamMessage("msg123");
```

#### Médias

```typescript
// Upload
const upload = await client.uploadMediaFile("/path/to/file.pdf");

// Download
const download = await client.downloadMediaFile("media123");

// Sauvegarder dans un fichier
const filePath = await client.downloadMediaToFile("media123", { target_path: "/tmp/file.pdf" });

// Récupérer le chemin de téléchargement URL (4.5.3)
const pathResult = await client.fetchMediaPathInfo("media123");

// Révoquer des messages
const result = await client.revokeMessage(["msg1", "msg2"]);
```

#### Rappels urgents (4.6.14)

```typescript
import { REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS } from "lansenger-sdk-ts";

const result = await client.sendReminderMsg(
  "msg123",
  [REMINDER_TYPE_POPUP, REMINDER_TYPE_SMS],
  ["staff1", "staff2"],
);
```

## 5. Groups

```typescript
// Créer un groupe
const group = await client.createGroup("Chat Projet", "orgId", { staff_id_list: ["s1", "s2", "s3"] });

// Récupérer infos & membres
const info = await client.fetchGroupInfo("groupOpenId");
const members = await client.fetchGroupMembers("groupOpenId");
const groups = await client.fetchGroupList();

// Vérifier le membership
const result = await client.checkIsInGroup("groupOpenId", { staff_id: "staff1" });

// Mettre à jour les paramètres
await client.updateGroupInfo("groupId", { name: "Nouveau nom", manage_mode: 1 });

// Ajouter/supprimer des membres
await client.updateGroupMembers("groupId", { add_user_list: ["staff4"], del_user_list: ["staff3"] });

// Dissoudre un groupe (propriétaire uniquement, 4.28.6)
await client.dismissGroup("groupId");
```

## 6. Calendrier & Schedule

```typescript
// Récupérer le calendrier principal (requiert userToken ou userId)
const cal = await client.fetchPrimaryCalendar({ user_token: "ut" });

// Créer un schedule
const schedule = await client.createSchedule(
  cal.calendar_id!, "Réunion d'équipe",
  { date: "2024-01-15", time: "10:00", timeZone: "Asia/Shanghai" },
  { date: "2024-01-15", time: "11:00", timeZone: "Asia/Shanghai" },
  [{ staffId: "staff1", attendeeFlag: "required" }],
  { user_token: "ut" },
);

// Récupérer/supprimer un schedule
const info = await client.fetchSchedule("cal1", "sch1", { user_token: "ut" });
await client.deleteSchedule("cal1", "sch1", { user_token: "ut" });

// Liste de schedules dans un intervalle de temps (max 42 jours)
const schedules = await client.fetchScheduleList("cal1", 1705276800000, 1707940800000, { user_token: "ut" });

// Gestion des participants
const attendees = await client.fetchScheduleAttendees("cal1", "sch1", { user_token: "ut" });
await client.addScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });
await client.deleteScheduleAttendees("cal1", "sch1", ["staff2"], { user_token: "ut" });

// Mettre à jour un schedule (4.23.12)
await client.updateSchedule("cal1", "sch1", { summary: "Réunion mise à jour", user_token: "ut" });

// Mettre à jour les métadonnées de participant (4.23.17) — RSVP, couleur, occupé/libre, rappels
await client.updateScheduleAttendeeMeta("cal1", "sch1", {
  rsvp_status: "accept", busy_free_state: "busy", remind_times: [5, 15], user_token: "ut",
});
```

## 7. Todo unifié

```typescript
import { TODO_TYPE_APPROVAL, TODO_TODO_STATUS_DONE } from "lansenger-sdk-ts";

// Créer une tâche todo
const todo = await client.createTodoTask(
  "Demande d'approbation", "https://app.com/a/1", "https://pc.app.com/a/1",
  ["staff1"], "org1", TODO_TYPE_APPROVAL,
);

// Mettre à jour le statut (11=à lire, 12=lu, 21=à faire, 22=fait)
await client.updateTodoTaskStatus("taskId", TODO_TODO_STATUS_DONE, "org1");

// Mettre à jour le contenu
await client.updateTodoTask("taskId", "Mis à jour", "l", "p", "org1");

// Supprimer (envoyeur uniquement)
await client.deleteTodoTask("taskId", "org1");

// Interroger
const listResult = await client.fetchTodoTaskList("org1");
const task = await client.fetchTodoTaskById("taskId", "org1");
const task = await client.fetchTodoTaskBySourceId("src1", "org1");
const counts = await client.fetchTodoTaskStatusCounts("staff1", "org1");

// Gestion des exécuteurs
await client.addExecutors(["staff2"], "org1", { todotask_id: "taskId" });
await client.deleteExecutors(["staff2"], "org1", { todotask_id: "taskId" });
const executors = await client.fetchExecutorList("taskId", "org1");
await client.updateExecutorStatus(
  [{ executorId: "staff1", todotaskId: "taskId", status: "22" }],
  "org1",
);
```

## 8. Lecture de chats (4.24 MCP)

```typescript
// Récupérer la liste de chats (privé + groupe)
const chatList = await client.fetchChatList({ user_token: "ut" });

// Récupérer les messages de chat
const messages = await client.fetchChatMessages({
  staff_id: "staff1", // ou group_id: "group1"
  user_token: "ut",
});
```

## 9. Événements de callback

Le SDK prend en charge les payloads de callback en JSON brut et en AES chiffré (selon la spec API Lansenger 4.10.1.4).

### Configuration

Définissez `encoding_key` et `callback_token` (des paramètres de callback du Lansenger Developer Center) :

```typescript
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, undefined, "BASE64_AES_KEY", "CALLBACK_TOKEN");
```

Ou via les variables d'environnement : `LANSENGER_ENCODING_KEY`, `LANSENGER_CALLBACK_TOKEN`.

### Parser le payload de callback (auto-détecte chiffré vs JSON brut)

```typescript
import { parseCallbackPayload } from "lansenger-sdk-ts";

// Webhook JSON brut
const events = parseCallbackPayload('{"events": [...]}');

// Payload chiffré AES (auto-décryptage avec encodingKey)
const events = parseCallbackPayload(encryptedData, {
  encoding_key: "BASE64_AES_KEY",
  known_app_id: "your-appid",
});
```

### Vérifier la signature

```typescript
import { verifyCallbackSignature } from "lansenger-sdk-ts";

// sha1(sort(token, timestamp, nonce, dataEncrypt))
const isValid = verifyCallbackSignature(
  timestamp, nonce, signature, encodingKey,
  { data_encrypt: encryptedData, callback_token: "CALLBACK_TOKEN" },
);
```

### Types d'événements

```typescript
const types = LansengerClient.getCallbackEventTypes(); // 25 types d'événements, 13 catégories
```

## Matrice de capacités des types de messages

| msgType | Markdown | @mention | Attachments | Canaux privés | Chat de groupe | Notes |
|---------|----------|----------|-------------|----------------|----------------|-------|
| `text` | ✗ | ✓ (groupe) | ✓ | Bot, Compte officiel, Impersonnation | ✓ | Max 6000 octets |
| `formatText` | ✓ | ✗ | ✗ | Impersonnation uniquement | ✓ | formatType=1 supporte Markdown |
| `oacard` | ✗ | ✗ | ✗ | Bot, Compte officiel, Impersonnation | ✓ | Carte simple avec champs |
| `appCard` | ✓ (div) | ✗ | ✗ | Bot, Compte officiel, Impersonnation | ✓ | Carte riche, mises à jour dynamiques |
| `linkCard` | ✗ | ✗ | ✗ | Bot, Compte officiel | ✓ | Carte de lien preview |
| `appArticles` | ✗ | ✗ | ✗ | Bot privé uniquement | ✓ | Liste d'articles (1+ articles) |

**Chat de groupe** supporte tous les types de messages. Seul le chat de groupe supporte @mention.

## Configuration

### Variables d'environnement

| Variable | Requis | Description | Défaut |
|----------|--------|-------------|--------|
| `LANSENGER_APP_ID` | ✓ | ID App/Bot | — |
| `LANSENGER_APP_SECRET` | ✓ | Secret App/Bot | — |
| `LANSENGER_API_GATEWAY_URL` | ✗ | URL de la passerelle API | `https://open.e.lanxin.cn/open/apigw` |
| `LANSENGER_PASSPORT_URL` | ✗ | URL Passport (pour OAuth2) | — |
| `LANSENGER_REDIRECT_URI` | ✗ | URI de redirection OAuth2 | `http://localhost:8765` |
| `LANSENGER_ENCODING_KEY` | ✗ | Clé de chiffrement AES callback (Base64) | — |
| `LANSENGER_CALLBACK_TOKEN` | ✗ | Token de signature callback | — |

### Persistance des identifiants & tokens

Par défaut, les identifiants et tokens restent en mémoire uniquement (perdus à la sortie du processus). Activez la persistance fichier avec `storePath` :

```typescript
import { LansengerClient, CredentialStore } from "lansenger-sdk-ts";

// Persistance auto vers ~/.lansenger/sdk_state.json
const client = new LansengerClient("appid", "secret", undefined, undefined, undefined, "~/.lansenger/sdk_state.json", "BASE64_AES_KEY", "CALLBACK_TOKEN");

// Ou depuis les variables d'environnement avec persistance
const client = LansengerClient.fromEnv("~/.lansenger/sdk_state.json");

// Opérations manuelles sur le store
const store = new CredentialStore("~/.lansenger/sdk_state.json");
store.saveCredentials("app_id", "app_secret", "https://open.e.lanxin.cn/open/apigw");
store.saveUserToken("user_token", "refresh_token");
const token = store.loadAppToken(); // None si expiré
```

## Structure du projet

```
lansenger-sdk-ts/
├── src/
│   ├── index.ts              # Toutes les exports
│   ├── client.ts             # LansengerClient (async)
│   ├── config.ts             # LansengerConfig
│   ├── auth.ts               # TokenManager — cycle de vie appToken
│   ├── oauth.ts              # Aides OAuth2
│   ├── constants.ts          # Endpoints API, types de médias, scopes OAuth
│   ├── exceptions.ts         # Hiérarchie LansengerError
│   ├── models.ts             # 38+ types de résultat
│   ├── http.ts               # doGet, doPost, doPostMultipart, parseApiResponse
│   ├── urlHelpers.ts         # buildApiUrl (supporte pathVars)
│   ├── contacts.ts           # API Staff & infos org
│   ├── departments.ts        # API Départements
│   ├── accountMessages.ts    # Canal compte officiel
│   ├── userMessages.ts       # Canal impersonnation utilisateur
│   ├── groupMessages.ts      # Canal Chat de groupe
│   ├── media.ts              # Upload/download
│   ├── streaming.ts          # Streaming SSE
│   ├── persistence.ts        # CredentialStore — persistance fichier des identifiants & tokens
│   ├── callbacks.ts          # Événements de callback — 25 types, décryptage AES, vérification SHA1
│   ├── groups.ts             # API Groups (incluant dissoudre 4.28.6)
│   ├── todos.ts              # Todo unifié
│   ├── calendars.ts          # Calendrier & Schedule
│   ├── reminders.ts          # Rappels urgents (4.6.14)
│   ├── chats.ts              # Lecture de chats (4.24 MCP)
│   └── users.ts              # Infos utilisateur
├── tests/                    # Tests unitaires
├── package.json
├── tsconfig.json
├── jest.config.js
├── LICENSE
└── README*.md                # READMEs en 5 langues
```

## Développement

```bash
npm install
npm run build    # Compiler TypeScript → dist/
npm test         # Exécuter les tests Jest
npm run lint     # Vérification de types uniquement (tsc --noEmit)
```

## Licence

MIT — voir [LICENSE](LICENSE).