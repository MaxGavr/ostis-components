// PaintPanel

BookSearchByTimePeriod.PaintPanel = function (containerId) {
    this.containerId = containerId;

    this.requiredKeynodes = [
        "rrel_1",
        "rrel_2",
        "ui_menu_search_book_by_time_period",
    ];
    this.keynodes = {};
};

BookSearchByTimePeriod.PaintPanel.prototype = {

    init: function () {
        this._debugMessage("SearchByTimePeriod: initialize");

        this._initMarkup(this.containerId);
        this._resolveKeynodes();
    },

    getKeynode: function (idtf) {
        return this.keynodes[idtf];
    },

    _resolveKeynodes: function () {
        SCWeb.core.Server.resolveScAddr(this.requiredKeynodes, resolvedKeynodes => {
            this.keynodes = resolvedKeynodes;
            this._debugMessage("SearchByTimePeriod: keynodes resolved");
        });
    },

    _initMarkup: function (containerId) {
        this._debugMessage("SearchByTimePeriod: initializing html");

        var cont = $('#' + containerId);

        // title
        cont.append(
            '<div class="panel panel-primary" id="book_search_panel" style="width: 70%;">' +
                '<div class="panel-heading"><h4 class="panel-title">Поиск книг, изданных в указанный период</h4></div>' +
            '</div>'
        );

        // 'period' label, year inputs and slider widget
        $('#book_search_panel').append(
            '<div class="form-row">' + 
                '<div class="col-sm-2" style="margin-top: 20px;">' +
                    '<label for="first_year_label">Период:</label>' +
                '</div>' + 
                '<div class="col-sm-4" style="margin-top: 20px;">' +
                    '<input type="number" id="first_year_label" class="form-control" placeholder="начало" min="0" max="2019">' +
                '</div>' + 
                '<div class="col-sm-4" style="margin-top: 20px;">' +
                    '<input type="number" id="last_year_label" class="form-control" placeholder="конец" min="0" max="2019">' +
                '</div>' + 
                    '<div class="col-sm-12" id="year_slider" style="margin-top: 15px;"></div>' +
                '</div>' + 
            '</div>'
        );

        // synchronize input values with slider
        $('#first_year_label').change( () => {
            $('#year_slider').slider("values", 0, $('#first_year_label').val());
        });
        $('#last_year_label').change( () => {
            $('#year_slider').slider("values", 1, $('#last_year_label').val());
        });

        // create slider widget
        var self = this;
        $('#year_slider').slider({
            range: true,
            min: 0,
            max: 2019,
            values: [0, 2019],
            slide: function(event, ui) {
                self._onPeriodChanged(ui.values[0], ui.values[1]);
            }
        });
        this._onPeriodChanged(0, 2019);
        
        // 'submit' button
        $('#book_search_panel').append(
            '<div class="col-sm-12" style="margin-top: 20px;">' +
                '<button id="find_books_button" type="button" class="btn btn-primary btn-block" value>Найти книги</button>' +
            '</div>'
        );

        $('#find_books_button').click(
            () => this._findBooks()
        );
    },

    _onPeriodChanged: function (firstYear, lastYear) {
        $('#first_year_label').val(firstYear);
        $('#last_year_label').val(lastYear);
    },

    _findBooks: function () {
        this._debugMessage("SearchByTimePeriod: start searching books");

        if (Object.keys(this.keynodes).length != this.requiredKeynodes.length) {
            alert("Ошибка! Не удалось найти необходимые понятия");
            return;
        }

        this._createSearchParameters().done(params => {
            this._debugMessage("SearchByTimePeriod: initiating search command");

            var command = this.getKeynode('ui_menu_search_book_by_time_period');
            SCWeb.core.Main.doCommand(command, [params], result => {
                this._debugMessage("SearchByTimePeriod: search command executed");

                if (result.question != undefined)
                    SCWeb.ui.WindowManager.appendHistoryItem(result.question);
            });
        });    
    },

    _createSearchParameters: function () {
        var dfd = new jQuery.Deferred();

        this._debugMessage("SearchByTimePeriod: creating search parameters");

        // create time period node
        window.sctpClient.create_node(sc_type_node | sc_type_const).done(time_period => {

            var promises = [
                this._createBeginYearParameter(time_period),
                this._createEndYearParameter(time_period),
            ];

            Promise.all(promises).then(
                () => dfd.resolve(time_period)
            ).catch(
                () => dfd.reject()
            );

        }).fail(
            () => dfd.reject()
        );

        return dfd.promise();
    },

    _createBeginYearParameter: function (timePeriodNode) {
        var dfd = new jQuery.Deferred();
        var dfdLinkContent = new jQuery.Deferred();

        // create first year link
        window.sctpClient.create_link().done(firstYearLink => {

            var firstYear = $('#first_year_label').val();
            window.sctpClient.set_link_content(firstYearLink, firstYear.toString()).done(
                () => dfdLinkContent.resolve()
            ).fail(
                () => dfdLinkContent.reject()
            );

            // connect first year to the time period
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, timePeriodNode, firstYearLink).done(firstYearArc => {
                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, this.getKeynode("rrel_1"), firstYearArc).done(
                    () => dfd.resolve()
                ).fail(
                    () => dfd.reject()
                );
            }).fail(
                () => dfd.reject()
            );
        }).fail(
            () => dfd.reject()
        )

        return Promise.all([
            dfd.promise(),
            dfdLinkContent.promise(),
        ]);
    },
    
    _createEndYearParameter: function (timePeriodNode) {
        var dfd = new jQuery.Deferred();
        var dfdLinkContent = new jQuery.Deferred();

        // create last year link
        window.sctpClient.create_link().done(lastYearLink => {

            var lastYear = $('#last_year_label').val();
            window.sctpClient.set_link_content(lastYearLink, lastYear.toString()).done(
                () => dfdLinkContent.resolve()
            ).fail(
                () => dfdLinkContent.reject()
            );

            // connect last year to the time period
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, timePeriodNode, lastYearLink).done(endYearArc => {
                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, this.getKeynode("rrel_2"), endYearArc).done(
                    () => dfd.resolve()
                ).fail(
                    () => dfd.reject()
                );
            }).fail(
                () => dfd.reject()
            );
        }).fail(
            () => dfd.reject()
        )

        return Promise.all([
            dfd.promise(),
            dfdLinkContent.promise(),
        ]);
    },

    _debugMessage: function (message) {
        console.log(message);
    }
};