function addLogoffListener(socket) {

    socket.on("logoff", () => {
        setTimeout(() => {
            location.reload()
        }, 1000);
    })
}