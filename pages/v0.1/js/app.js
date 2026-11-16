// Film Log Mobile App JS
const sampleTickets = [
    {
        id: "t-001",
        title: "파묘 (Exhuma)",
        date: "2026.03.14",
        time: "19:30 ~ 21:44",
        theater: "CGV 용산아이파크몰 4DX",
        seat: "H열 12번",
        rating: 4.5,
        comment: "몰입감이 미쳤다. 최민식 배우와 김고은 배우의 연기합이 대단했음.",
        posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80",
        genre: "미스터리/공포",
        companion: "혼자 관람"
    },
    {
        id: "t-002",
        title: "듄: 파트 2 (Dune 2)",
        date: "2026.03.02",
        time: "14:00 ~ 16:46",
        theater: "메가박스 코엑스 돌비시네마",
        seat: "G열 09번",
        rating: 5.0,
        comment: "시각적, 청각적 전율. 영화관의 존재 이유를 보여주는 대작.",
        posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&auto=format&fit=crop&q=80",
        genre: "SF/액션",
        companion: "친구와 함께"
    },
    {
        id: "t-003",
        title: "오펜하이머 (Oppenheimer)",
        date: "2026.02.18",
        time: "10:15 ~ 13:15",
        theater: "롯데시네마 월드타워 SUPER PLEX",
        seat: "F열 15번",
        rating: 4.0,
        comment: "사운드 연출이 기막힘. 전반부 대사량이 많아 재관람 필요할 듯.",
        posterUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80",
        genre: "전기/드라마",
        companion: "연인과 함께"
    }
];

let tickets = [...sampleTickets];
let currentViewMode = 'card';

try {
    const savedTickets = JSON.parse(localStorage.getItem('film-log-tickets') || 'null');
    if (Array.isArray(savedTickets)) tickets = savedTickets;
} catch (error) {
    console.warn('저장된 관람 기록을 불러오지 못했습니다.', error);
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('ticket-container');
    const emptyState = document.getElementById('empty-state');
    const statCount = document.getElementById('stat-count');
    const searchToggleBtn = document.getElementById('btn-search-toggle');
    const searchBarContainer = document.getElementById('search-bar-container');
    const searchInput = document.getElementById('movie-search-input');
    const searchClearBtn = document.getElementById('btn-search-clear');
    const sortSelect = document.getElementById('sort-select');

    const btnCard = document.getElementById('view-mode-card');
    const btnGrid = document.getElementById('view-mode-grid');
    const btnList = document.getElementById('view-mode-list');

    function renderTickets(data) {
        if (!container) return;
        container.innerHTML = '';
        
        if (!data || data.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        } else {
            if (emptyState) emptyState.classList.add('hidden');
        }

        if (currentViewMode === 'card') {
            container.className = "space-y-4";
            data.forEach(ticket => {
                const ticketEl = document.createElement('div');
                ticketEl.className = "ticket-shape p-4 border border-gray-200 transition-all hover:shadow-md cursor-pointer";
                ticketEl.onclick = () => showTicketDetail(ticket.id);
                
                ticketEl.innerHTML = `
                    <div class="flex space-x-3">
                        <img src="${ticket.posterUrl}" alt="${ticket.title}" class="w-20 h-28 object-cover rounded-lg border border-gray-200 flex-shrink-0">
                        <div class="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between items-start">
                                    <span class="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">${ticket.genre}</span>
                                    <span class="text-xs text-gray-700 font-bold">★ ${ticket.rating.toFixed(1)}</span>
                                </div>
                                <h3 class="font-bold text-gray-900 text-sm mt-1 truncate">${ticket.title}</h3>
                                <p class="text-[11px] text-gray-500 mt-0.5"><i class="fa-regular fa-calendar-check mr-1"></i>${ticket.date}</p>
                                <p class="text-[11px] text-gray-500"><i class="fa-solid fa-location-dot mr-1"></i>${ticket.theater}</p>
                            </div>
                            <div class="text-[10px] text-gray-400 truncate">좌석: ${ticket.seat}</div>
                        </div>
                    </div>
                    <div class="dashed-divider my-3"></div>
                    <div class="flex justify-between items-center text-xs text-gray-600">
                        <p class="italic text-gray-500 truncate flex-1 mr-2">"${ticket.comment}"</p>
                        <span class="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">${ticket.companion}</span>
                    </div>
                `;
                container.appendChild(ticketEl);
            });
        }
        if (statCount) statCount.textContent = `${tickets.length}편`;
    }

    function showTicketDetail(ticketId) {
        const item = tickets.find(t => t.id === ticketId);
        if (item) {
            alert(`[티켓 상세 보기]\n영화: ${item.title}\n일시: ${item.date} (${item.time})\n극장: ${item.theater}\n좌석: ${item.seat}\n내 한줄평: ${item.comment}`);
        }
    }

    if (btnCard) btnCard.addEventListener('click', () => { currentViewMode = 'card'; renderTickets(tickets); });
    renderTickets(tickets);
});
