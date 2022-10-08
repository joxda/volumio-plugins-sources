#!/usr/bin/python3

import pigpio
import sys
pi = pigpio.pi()


# build RC5 message, return as int
def build_rc5(toggle, dev, cmd):
    # TBD: check whether dev / cmd exist....
    RC5_CMD = int(cmds[dev][cmd])
    RC5_START = 0b100 + (0b010 * (RC5_CMD < 64)) + (0b001 * toggle)
    RC5_SYS = int(devs[dev])

    # RC-5 message has a 3-bit start sequence, a 5-bit system ID, and a 6-bit command.
    RC5_MSG = ((RC5_START & 0b111) << 11) | (
        (RC5_SYS & 0b11111) << 6) | (RC5_CMD & 0b111111)
    toggle = not toggle
    return RC5_MSG

# manchester encode waveform. Period is the half-bit period in microseconds.


def wave_mnch(DATA, PIN):
    pi.set_mode(PIN, pigpio.OUTPUT)  # set GPIO pin to output.

    # create msg
    # syntax: pigpio.pulse(gpio_on, gpio_off, delay us)
    msg = []
    # this is a terrible way to iterate over bits... but it works.
    for i in bin(DATA)[2:]:
        if i == '1':
            msg.append(pigpio.pulse(0, 1 << PIN, RC5_PER))  # L
            msg.append(pigpio.pulse(1 << PIN, 0, RC5_PER))  # H
        else:
            msg.append(pigpio.pulse(1 << PIN, 0, RC5_PER))  # H
            msg.append(pigpio.pulse(0, 1 << PIN, RC5_PER))  # L

    # return line to idle condition.
    msg.append(pigpio.pulse(0, 1 << PIN, RC5_PER))
    pi.wave_add_generic(msg)
    wid = pi.wave_create()
    return wid


def execute(pin, device, command, toggle, repeat):

    for i in range(repeat):
        # generate RC5 message (int)
        rc5_msg = build_rc5(toggle, device, command)

        # generate digital manchester-encoded waveform
        wid = wave_mnch(rc5_msg, pin)

    for _ in range(repeat):
        cbs = pi.wave_send_once(wid)


pin = sys.argv[1]
device = sys.argv[2]
command = sys.argv[3]
toggle = sys.argv[4]
repeat = sys.argv[5]

execute(pin, device, command, toggle, repeat)

sys.exit(0)
