# API Funcraft

Une API pour récupérer les statistiques de FunCraft.net !

## Sommaire

[Utilisation :](#utilisation)
 - [Initialisation](#initialisation)
 - [FuncraftApi.stats](#funcraftapi-stats)
 - [FuncraftApi.allstats](#funcraftapi-allstats)
 - [FuncraftApi.infos](#funcraftapi-infos)
 - [FuncraftApi.friends](#funcraftapi-friends)
 - [FuncraftApi.head](#funcraftapi-head)
 - [FuncraftApi.table](#funcraftapi-table)

[Autre informations :](#autre-informations)
 - [Codes d'erreur](#codes-derreur)
 - [Périodes](#periodes)
 - [Jeux](#jeux)

<a name="utilisation" />

## Utilisation

L'API est documenté avec JSDoc. Elle est également compatible avec TypeScript.

<a name="initialisation" />

### Initialisation :

Installez le paquet avec NPM : `npm install funcraft-api` ou Yarn : `yarn add funcraft-api`.

```js
const FuncraftApi = require('funcraft-api');
```

<a name="funcraftapi-stats" />

### FuncraftApi.stats(period, game, username): Promise\<StatsResponse\>

Renvoie une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise) contenant les statistiques d'un mode de jeu et d'une période spécifique.

```js
FuncraftApi.stats('toujours', 'shootcraft', 'jujoh').then(console.log).catch(console.error);
```

```js
{
  code: 0,
  error: null,
  userId: '177',
  username: 'jujoh',
  month: 0,
  monthName: 'always',
  game: 'shootcraft',
  rank: 22,
  data: {
    points: 229557,
    gameCount: 5029,
    winCount: 4901,
    defeatCount: 128,
    gameTime: 15467,
    kills: 234252,
    deathCount: 30149
  },
  stats: {
    winrate: 97.455,
    kd: 7.77,
    ragequit: 38.489,
    killsPerGame: 46.58,
    deathsPerGame: 5.995,
    pointsPerGame: 45.647,
    killsPerMinute: 15.145,
    secondsPerKill: 3.962
  },
  skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/jujoh/m2/f3cc7aa5869ddab02eafcfa37cc667209d34f3ca'
}
```

<a name="funcraftapi-allstats" />

### FuncraftApi.allStats(username): Promise\<object\>

Renvoie une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise) contenant les statistiques de tous les modes de jeux dans toutes les périodes disponibles.

```js
FuncraftApi.allStats('jujoh').then(console.log).catch(console.error);
```

```js
{
  code: 0,
  error: null,
  infos: {
    username: 'jujoh',
    skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/jujoh/m2/f3cc7aa5869ddab02eafcfa37cc667209d34f3ca',
    userId: '177'
  },
  rush_retro: {
    always: null,
    march: null,
    february: null,
    january: null,
    december: null
  },
  rush_mdt: {
    always: {
      code: 0,
      error: null,
      username: 'jujoh',
      month: 0,
      monthName: 'always',
      game: 'rush_mdt',
      rank: 19605,
      data: [Object],
      stats: [Object],
      skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/jujoh/m2/f3cc7aa5869ddab02eafcfa37cc667209d34f3ca',
      userId: '177'
    },
    march: null,
    february: null,
    january: null,
    december: null
  },
  ...
}
```

<a name="funcraftapi-infos" />

### FuncraftApi.infos(username, fetchFriends? = true): Promise\<InfosResponse\>

Renvoie une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise) contenant les informations d'un joueur. `fetchFriends` est un booléen spéicifiant si une autre requête pour récupérer les amis doit être faite.

La valeur de `ban` peut être : `NONE`, `TEMP` ou `DEF`.

```js
FuncraftApi.infos('jujoh').then(console.log);
```

```js
{
  code: 0,
  error: null,
  grade: 'Shootcraft',
  username: 'jujoh',
  userId: '177',
  skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/jujoh/m2/f3cc7aa5869ddab02eafcfa37cc667209d34f3ca',
  inscription: Date('2016-01-14T17:28:00.000Z'),
  lastConnection: Date('2021-03-29T21:06:00.000Z'),
  gloires: 1178354,
  gameCount: 14072,
  points: 596411,
  winCount: 12765,
  defeatCount: 1307,
  gameTime: 52529,
  kills: 276657,
  deathCount: 46711,
  ban: 'NONE',
  friends: [
    {
      nom: 'AcyD_',
      skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/AcyD_/s/fa4652a59a640d3bde1aca803f6a27ed81107f94'
    },
    ...
  ]
}
```

<a name="funcraftapi-friends" />

### FuncraftApi.friends(userId): Promise\<object\>

Renvoie une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise) contenant la liste des amis d'un joueur.

```js
FuncraftApi.friends('177').then(console.log);
```

```js
{
  code: 0,
  error: null,
  friends: [
    {
      nom: 'AcyD_',
      skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/AcyD_/s/fa4652a59a640d3bde1aca803f6a27ed81107f94'
    },
    ...
  ]
}
```

<a name="funcraftapi-head" />

### FuncraftApi.head(username): Promise\<string\>

Renvoie une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise) contenant l'URL du skin de la tête d'un joueur.

```js
FuncraftApi.head('jujoh').then(console.log);
```

```js
'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/jujoh/m2/f3cc7aa5869ddab02eafcfa37cc667209d34f3ca'
```

<a name="funcraftapi-table" />

### FuncraftApi.table(period, game): Promise\<StatsResponse[]\>

Renvoie une [promesse](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Promise) contenant les stats du top 100 d'un jeu. Les skins ne sont disponible que pour les 3 premiers joueurs.

```js
FuncraftApi.table('always', 'shootcraft').then(console.log);
```

```js
[
  {
    code: 0,
    error: null,
    userId: '393176',
    username: 'CptnKILL',
    month: 0,
    monthName: 'always',
    game: 'shootcraft',
    rank: 1,
    data: {
      points: 1402275,
      gameCount: 13440,
      winCount: 9462,
      defeatCount: 3978,
      gameTime: 50883,
      kills: 640543,
      deathCount: 207115
    },
    stats: {
      winrate: 70.402,
      kd: 3.093,
      ragequit: 24.281,
      killsPerGame: 47.659,
      deathsPerGame: 15.41,
      pointsPerGame: 104.336,
      killsPerMinute: 12.589,
      secondsPerKill: 4.766
    },
    skin: 'https://d31zb6ev5hmn3f.cloudfront.net/_u/avatar/head/CptnKILL/s/cc9d545b3ccc7b9789cb902aed70e8bfe276317b'
  },
  ...
]
```

<a name="autres-informations" />

## Autres informations

<a name="codes-derreur" />

### Codes d'erreur

Lorsqu'une requête échoue, la promesse retourn une erreur sous la forme d'un objet de la forme suivante :

```js
{ code: 1, error: 'Specified game is incorrect.' }
```

Voici les différents codes d'erreur :

| Code | Description                           |
|:----:| ------------------------------------- |
| 0    | Aucune erreur                         |
| 1    | Jeu incorrect                         |
| 2    | Période incorrecte                    |
| 3    | Joueur inconnu                        |
| 4    | Aucune données pour cette période     |
| 5    | Erreur de connexion avec funcraft.net |

<a name="periodes" />

### Périodes

Pour les statistiques global, vous pouvez utiliser :
 - toujours
 - always
 - 0

Pour les statistiques mensuels :
 - le nom du mois en français (janvier, février, fevrier, etc.)
 - le nom du mois en anglais (january, february, etc.)
 - le chiffre le représentant (1 = janvier, 2 = février, etc.)

Pour les tableaux du top 100, vous devez spécifier soit `always`, soit la période sous la forme `YYYY-MM`.

Note : vous ne pouvez pas récupérer via la méthode `stats` les statistiques datant de plus de 3 mois.
Note 2 : les accents ne sont pas pris en compte.

<a name="jeux" />

### Jeux

Les noms et alias des jeux sont :

| Noms  | rush_retro | rush_mdt | hikabrain | skywars | octogone | shootcraft | infected | survival | blitz | pvpsmash | landrush |
|-------|------------|----------|-----------|---------|----------|------------|----------|----------|-------|----------|----------|
| Alias |            | rush     | hika      | sky     | mma      | shoot      | infecte  |          |       | pvp      | land     |

Note : les accents ne sont pas pris en compte.

### Outils

Vous pouvez récupérer les liste des noms et alias des jeux dans `FuncraftApi.utils.data`.

Les fonction `FuncraftApi.utils.vGetPeriod` et `FuncraftApi.utils.vGetGame` servent à déterminer si une période ou un mode de jeu est valide.

Se référer à la JSDoc ou voir le code source pour plus de détails.

## Licence

Licence MIT

Copyright (c) 2021 gauthier-th