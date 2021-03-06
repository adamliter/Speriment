/// <reference path="container.ts"/>
/// <reference path="block.ts"/>
/// <reference path="page.ts"/>
/// <reference path="option.ts"/>
/// <reference path="record.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/underscore/underscore.d.ts" />

// global constants for referring to HTML
var PAGE = "#pagetext",
    RESOURCES = "#resourceDiv",
    OPTIONS = "#responseDiv",
    NAVIGATION = "div.navigation",
    CONTINUE = "#continue"; // Next or Submit button

class Experiment implements Container{
    public id: string;
    public exchangeable: string[];
    public counterbalance: string[];
    public version: number;
    public permutation: number;
    public contents: Block[];
    public containerIDs: string[] = [];
    public experimentRecord: ExperimentRecord;
    public banks;

    constructor(jsonExperiment, version, permutation, psiturk){
        jsonExperiment = _.defaults(jsonExperiment, {exchangeable: [], counterbalance: [], banks: {}});
        this.version = parseInt(version);
        this.permutation = parseInt(permutation);
        this.exchangeable = jsonExperiment.exchangeable;
        this.counterbalance = jsonExperiment.counterbalance;
        this.banks = shuffleBanks(jsonExperiment.banks);
        this.experimentRecord = new ExperimentRecord(psiturk, this.permutation);

        this.contents = makeBlocks(jsonExperiment.blocks, this);
        this.contents = orderBlocks(this.contents, this.exchangeable, this.permutation, this.counterbalance);
    }

    public start(){
        Experiment.addElements();
        this.run(this.experimentRecord);
    }

    static addElements(){
        var experimentDiv = document.createElement('div');
        $(experimentDiv).attr("id", "experimentDiv");

        var questionPar = document.createElement('p');
        $(questionPar).attr('id', 'pagetext');

        var resourceDiv = document.createElement('div');
        $(resourceDiv).attr('id', 'resourceDiv');

        var responseDiv = document.createElement('div');
        $(responseDiv).attr('id', 'responseDiv');

        var navigationDiv = document.createElement('div');
        $(navigationDiv).addClass('navigation');

        var nextButton = document.createElement("input");
        $(nextButton).attr({type: "button", id: "continue", value: "Next"});

        $('body').append(experimentDiv);
        $(experimentDiv).append(questionPar, resourceDiv, responseDiv, navigationDiv);
        $(navigationDiv).append(nextButton);
    }

    public run(experimentRecord: ExperimentRecord){
        if (!_.isEmpty(this.contents)){
            var block = this.contents.shift();
            block.run(experimentRecord);
        } else {
            experimentRecord.submitRecords();
        }
    }

}
