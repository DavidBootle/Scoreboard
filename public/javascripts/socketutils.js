function addLogoffListener(socket) {
    socket.on("logoff", () => {
        location.reload();
    })
}

function addScoreboardListener(socket) {
    socket.on('scoreboard-update', () => {
        location.reload();
    })
}

function addUserListener(socket) {
    socket.on('user-update', () => {
        location.reload();
    })
}