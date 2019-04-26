function ModuleEvents(parent) {
    this.parent = parent;

    this.events = 0;
    this.maxEvents = 5;
}

ModuleEvents.prototype = {

    getRequiredKeynodes: function () {
        return [
            'literary_event',
            'question_append_event_to_pattern'
        ];
    },

    getSelectedCriteriaCount: function () {
        var criteriaCount = 0;

        for (var i = 0; i < this.events; ++i) {
            if ($(`#event_type_check_${i}`).prop('checked'))
                ++criteriaCount;
        }

        return criteriaCount;
    },

    initMarkup : function (containerId) {
        this._debugMessage("initializing html");

        var container = $('#' + containerId);

        // form
        container.append('<div class="container-fluid"><form id="events_form">');

        // 'add event' button
        $('#events_form').append(
            '<hr/>' +
            '<button id="add_event_button" type="button" class="btn btn-secondary">Добавить событие</button>' +
            '<hr/>'
        );

        $('#add_event_button').click(
            () => this._addEvent()
        );
    },

    onKeynodesResolved: function () {
        this._debugMessage("keynodes resolved (nothing to do)");
    },

    appendCriteriaToPattern: function (pattern) {
        this._debugMessage(`appending selected criteria to pattern (${this.events} events)`);

        var dfd = new jQuery.Deferred();

        // append each event to pattern
        var promises = [];
        for (var i = 0; i < this.events; ++i) {
            promises.push(this._appendEventToPattern(pattern, i));
        }

        Promise.all(promises).then(
            () => dfd.resolve()
        ).catch(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _appendEventToPattern: function (pattern, index) {
        this._debugMessage(`appending event ${index} to pattern`);
        
        var dfd = new jQuery.Deferred();

        window.sctpClient.create_node(sc_type_const).done( params => {

            var promises = [];
            promises.push(this.parent.appendParameter(params, pattern, this._getKeynode("rrel_1")));

            if ($(`#event_type_check_${index}`).prop('checked'))
                promises.push(this._appendEventTypeParameter(params, index));

            Promise.all(promises).then(() => {
                this.parent.initializeAgent('question_append_event_to_pattern', params).done(
                    () => dfd.resolve()
                ).fail(
                    () => dfd.reject()
                );
            }).catch(
                () => dfd.reject()
            );

        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _appendEventTypeParameter: function (params, index) {
        var dfd = new jQuery.Deferred();

        var label = $(`#event_type_select_${index} option:selected`).text();
        this._debugMessage(`appending type "${label}" of event ${index}`);

        var event_type = $(`#event_type_select_${index} option:selected`).val();
        this.parent.appendParameter(params, event_type, this._getKeynode("rrel_2")).done(
            () => dfd.resolve()
        ).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _addEvent: function () { 
        
        if (this.events >= this.maxEvents) {
            alert(`Лимит событий (${this.maxEvents}) достигнут!`);
            return;
        }

        if (this.events > 0)
            $('#events_form').append('<hr/>');
        
        var index = this.events;
        this.events += 1;

        this._debugMessage(`adding event ${index}`);

        // event type
        $('#events_form').append(
            `<div class="form-group row">` + 
                `<label class="col-sm-2 col-form-label" for="event_type_select_${index}">Тип события:</label>` +
                `<div class="col-sm-4">` +
                    `<select id="event_type_select_${index}" class="form-control" disabled></select>` +
                `</div>` +
                `<div class="form-check col-sm-3 book_search_checkbox">` +
                    `<input id="event_type_check_${index}" class="form-check-input" type="checkbox">` +
                    `<label class="form-check-label book_search_checkbox_label" for="event_type_check_${index}">Учитывать тип</label>` +
                `</div>` +
            `</div>`
        );

        // enable/disable event type select on checkbox click
        var type_check = $(`#event_type_check_${index}`);
        type_check.click( () => {
            var checked = type_check.prop('checked');
            $(`#event_type_select_${index}`).prop('disabled', !checked);
        });

        this._fillDropdownLists(index);
    },

    _getKeynode: function (idtf) {
        return this.parent.getKeynode(idtf);
    },

    _fillDropdownLists: function (index) {
        this._debugMessage(`filling dropdown lists for event ${index}`);

        window.scHelper.getSetElements(this._getKeynode('literary_event')).done( event_types => {
            event_types.forEach(event_type => {
                window.scHelper.getIdentifier(event_type, scKeynodes.lang_ru).done( event_type_idtf => {
                    $(`#event_type_select_${index}`).append($('<option>', { value: event_type }).text(event_type_idtf));
                });
            });
        });
    },

    _debugMessage: function (msg) {
        this.parent._debugMessage("ModuleEvents: " + msg);
    }
}