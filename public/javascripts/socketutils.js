function addLogoffListener(socket) {

    socket.on("logoff", () => {
        location.reload()
    })
}