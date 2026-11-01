
# `1.1.1.` Node - <code>pnpm</code>

AlmaLinux üzerinde Node.js'in en güncel LTS (Long Term Support) sürümünü ve performanslı paket yöneticisi olan **pnpm**'i kurarak işe başlıyoruz.

## Node

::: info Sistem paketlerini güncelleyin

```bash
sudo dnf update -y
```
:::


::: info Node.js 20 LTS (veya güncel sürüm) reposunu ekleyin ve kurun

```bash
sudo dnf module reset nodejs -y
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs -y
```
:::

## `pnpm`

::: info `pnpm` paket yöneticisini global olarak kurun

```bash
sudo npm install -g pnpm
```

Kurulumları doğrulayın

```bash
node -v
pnpm -v
```
:::
