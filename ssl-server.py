from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

addr = 'localhost'
port = 5003
cert = './localhost+2.pem'
key = './localhost+2-key.pem'

if __name__ == '__main__':
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(cert, key)

    httpsd = HTTPServer((addr, port), SimpleHTTPRequestHandler)
    httpsd.socket = context.wrap_socket(httpsd.socket, server_side=True)
    print(f'Serving HTTPS on {addr} port {port} (https://{addr}:{port}/) ...')
    print('Listening on ' + addr + ':' + str(port))
    httpsd.serve_forever()
