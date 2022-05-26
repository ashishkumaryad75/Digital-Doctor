const Appointment = require('../models/appointment.model');
const uuid = require('uuid');
var amqp = require('amqplib/callback_api');
const queue = 'tasks';

exports.bookAppointment = (req, res) => {
    if (!req.body) {
        return res.status(400).send({
            messsage: 'The content can not be empty'
        });
    }

    const bookAppointment = new Appointment({
        appointmentId: uuid.v1(),
        slotId: req.body.slotId,
        patientEmail: req.body.patientEmail,
        doctorEmail: req.body.doctorEmail,
        specialization: req.body.specialization,
        appointmentDate: req.body.appointmentDate,
        appointmentStartTime: req.body.appointmentStartTime,
        appointmentEndTime: req.body.appointmentEndTime,
        appointmentStatus: req.body.appointmentStatus,
        bookedOn: req.body.bookedOn,
    })

    if (bookAppointment.slotId === null || bookAppointment.slotId === '' ||
        bookAppointment.patientEmail === null || bookAppointment.patientEmail === '' ||
        bookAppointment.doctorEmail === null || bookAppointment.doctorEmail === '') {
        return res.status(401).send({ msg: 'Book Appointment data missing' })
    }

    bookAppointment.save().then(data => {
        res.send(data);
        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }

                channel.assertQueue(queue);

                channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
                console.log(" [x] Sent %s", JSON.stringify(data));
            });
        });

    }).catch(err => {
        res.status(500).send({
            msg: "Error"
        });
    });
}

exports.appointmentListByFilter = (req, res) => {
    var query = req.query;
    Appointment.find(query, (err, result) => {
        res.send(result);
    });

}

exports.updateAppointmentStatus = (req, res) => {
    Appointment.find({ appointmentId: req.body.appointmentId }).then(response => {
        if (response.length > 0)
            Appointment.findByIdAndUpdate(response[0]._id, { $set: req.body }, { new: true }).then(users => {
                res.send(users)
            }).catch(err => {
                res.status(500).send({
                    msg: "error"
                })
            })
        else
            return res.status(500).send({
                msg: "Appointment not found"
            })
    }).catch(err => {
        res.status(500).send({
            msg: "Appointment not found"
        })
    })
}