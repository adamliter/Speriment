/// <reference path="record.ts" />
/// <reference path="page.ts" />
/// <reference path="../typings/underscore/underscore.d.ts" />

interface Resettable{
    reset(): void;
    run(experimentRecord: ExperimentRecord): void;
}

function resetContents(contents: any[], oldContents: any[]){
    contents = oldContents;
    oldContents = [];
    _.each(contents, (c) => {c.reset()});
    return {contents: contents, oldContents: oldContents}
}

function runChild(contents, oldContents, experimentRecord: ExperimentRecord){
    var nextChild = contents.shift();
    oldContents.push(nextChild);
    nextChild.run(experimentRecord);
}

function makePages(jsonPages, container): Page[] {
    var pages = _.map<any,Page>(jsonPages, (p)=>{
        if (p.options){
            return new Question(p, container);
        } else {
            return new Statement(p, container);
        }
    });
    return pages;
}
