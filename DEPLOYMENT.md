# Mettre à jour BookMyBook sur la VM Oracle

## 1. Développer et pousser depuis l’ordinateur local

```bash
git add .
git commit -m "Description of the change"
git push origin dev
```

## 2. Se connecter à la VM

Depuis l’ordinateur local :

```bash
ssh -i "$HOME/Téléchargements/ssh-key-2026-09-02.key" ubuntu@158.178.197.142
```

## 3. Récupérer la dernière version

```bash
cd /srv/bookmybook
git pull --ff-only origin dev
```

Ne jamais faire de `git reset --hard` sur la VM. Le fichier de production `backend/.env` et la base `backend/.tmp/data.db` ne sont pas suivis par Git.

Une fois le script installé sur la VM, les étapes 3 à 6 peuvent être remplacées par une seule commande :

```bash
cd /srv/bookmybook
bash scripts/deploy-vm.sh
```

Le script s’arrête immédiatement si une commande échoue. Il ne réinstalle les dépendances et ne reconstruit que la partie de l’application qui a changé.

## 4. Mettre à jour le frontend

À faire si le frontend a changé (ou après chaque mise à jour pour rester simple) :

```bash
cd /srv/bookmybook/frontend
npm ci
npm run build
```

Nginx sert automatiquement les fichiers créés dans `frontend/dist`.

## 5. Mettre à jour le backend

À faire si le backend ou ses dépendances ont changé :

```bash
cd /srv/bookmybook/backend
npm ci
npm run build
sudo systemctl restart bookmybook-backend
```

## 6. Vérifier le service

```bash
sudo systemctl status bookmybook-backend
```

Le statut attendu est `Active: active (running)`.

Pour consulter les logs en direct :

```bash
sudo journalctl -u bookmybook-backend -f
```

Pour vérifier Nginx :

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Vérifier le site

```text
https://bookmybook.duckdns.org
https://bookmybook.duckdns.org/admin
```

## Informations importantes

- Le frontend et le backend sont servis par la même URL ; `/api` est transmis à Strapi par Nginx.
- Les secrets de production sont dans `backend/.env` et ne doivent jamais être poussés sur GitHub.
- La base de données de production est `backend/.tmp/data.db` et est indépendante de la base locale.
- Le certificat HTTPS est renouvelé automatiquement par `certbot.timer`.

## Notifications sur mobile

Les notifications en arrière-plan utilisent Web Push. Générer une paire VAPID une seule fois dans le dossier `backend` :

```bash
npx web-push generate-vapid-keys
```

Conserver la clé privée uniquement dans `backend/.env` sur la VM, et ajouter :

```text
WEB_PUSH_SUBJECT=mailto:votre-adresse@example.com
WEB_PUSH_PUBLIC_KEY=...
WEB_PUSH_PRIVATE_KEY=...
```

La clé publique doit aussi être fournie au build frontend dans `frontend/.env.production` :

```text
VITE_WEB_PUSH_PUBLIC_KEY=...
```

Après configuration, reconstruire le frontend et redémarrer le backend. L’utilisateur connecté pourra ensuite activer les notifications dans Settings. Le navigateur demandera l’autorisation au niveau du système ; le site ne peut pas contourner un refus.
