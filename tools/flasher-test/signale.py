import fcntl
import os
import struct
import sys
import termios

fd = os.open(sys.argv[1], os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)
for zeile in sys.stdin:
    dtr, rts = (int(x) for x in zeile.split())
    bits = struct.unpack("I", fcntl.ioctl(fd, termios.TIOCMGET, struct.pack("I", 0)))[0]
    bits = (bits & ~(termios.TIOCM_DTR | termios.TIOCM_RTS)) | (termios.TIOCM_DTR if dtr else 0) | (termios.TIOCM_RTS if rts else 0)
    fcntl.ioctl(fd, termios.TIOCMSET, struct.pack("I", bits))
    sys.stdout.write("ok\n")
    sys.stdout.flush()
