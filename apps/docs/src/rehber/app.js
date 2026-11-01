import { fileTree } from './fileTree.js';

const extensionStyles = {
    '.js': { icon: 'fa-brands fa-js', color: '#f7df1e' },
    '.json': { icon: 'fa-solid fa-gear', color: '#cbd5e1' },
    '.crt': { icon: 'fa-solid fa-lock', color: '#4ade80' },
    '.key': { icon: 'fa-solid fa-key', color: '#facc15' },
    '.pem': { icon: 'fa-solid fa-shield-halved', color: '#34d399' },
    '.md': { icon: 'fa-regular fa-file-lines', color: '#60a5fa' }
};
const defaultFileStyle = { icon: 'fa-solid fa-file', color: '#94a3b8' };

function getFileStyle(filename) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return extensionStyles[ext] || defaultFileStyle;
}

// Rekürsif Render Fonksiyonu
function createTreeDOM(nodes, parentElement, depth = 0) {
    nodes.forEach(node => {
        const itemElement = document.createElement('div');
        // Her derinlik katmanı için sola doğru 20px otomatik kaydırır
        itemElement.style.paddingLeft = `${depth * 20}px`;

        if (node.type === 'folder') {
            itemElement.className = 'tree-item folder-item';
            itemElement.innerHTML = `
                <i class="fa-solid fa-chevron-down chevron"></i>
                <i class="fa-solid fa-folder icon icon-folder"></i>
                <span class="item-name">${node.name}</span>
                <span class="item-desc">${node.desc}</span>
            `;
            parentElement.appendChild(itemElement);

            // Alt çocukları sarmalayacak grup
            const subGroup = document.createElement('div');
            subGroup.className = 'tree-group';
            parentElement.appendChild(subGroup);

            // Alt klasör var mı kontrol et ve kendini derinliği artırarak tekrar çağır (Rekürsiyon)
            if (node.children && node.children.length > 0) {
                createTreeDOM(node.children, subGroup, depth + 1);
            }

            itemElement.addEventListener('click', () => {
                itemElement.classList.toggle('collapsed');
            });
        } else {
            const style = getFileStyle(node.name);
            itemElement.className = 'tree-item file-item';
            itemElement.innerHTML = `
                <span style="width: 15px; display: inline-block;"></span>
                <i class="${style.icon} icon" style="color: ${style.color};"></i>
                <span class="item-name">${node.name}</span>
                <span class="item-desc">${node.desc}</span>
            `;
            parentElement.appendChild(itemElement);
        }
    });
}

// Kök elemanı bulup ağacı başlat
const rootContainer = document.getElementById('file-tree-root');
if (rootContainer) {
    createTreeDOM(fileTree, rootContainer);
}

