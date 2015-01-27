/// <reference path="experiment.ts"/>
/// <reference path="block.ts"/>
/// <reference path="page.ts"/>
/// <reference path="viewable.ts"/>
/// <reference path="../node_modules/jquery/jquery.d.ts" />
/// <reference path="../node_modules/underscore/underscore.d.ts" />

class ResponseOption implements Viewable{

    public text: string;
    public id: string;
    public feedback: string;
    public correct: boolean;
    public tags: string[];
    public resources: string[];

    constructor(jsonOption, public question: Question){
        jsonOption = _.defaults(jsonOption, {feedback: null, correct: null, tags: [], text: null, resources: null});
        this.id = jsonOption.id;
        this.text = setText(jsonOption.text, this.question.block);
        this.feedback = jsonOption.feedback;
        this.resources = _.map(jsonOption.resources, (r: string):string => {return makeResource(r, this.question.block)});
        this.correct = jsonOption.correct; // has to be specified as false in the input for radio/check/dropdown if it should count as wrong
        this.tags = jsonOption.tags;
    }

    public display(){} //TODO make div with pars for resources and options

    public getResponse(){
        return [this.id, this.text];
    }

    public onChange(){
        if ($(OPTIONS+" :checked").length !== 0){
            this.question.enableNext();
        } else {
            this.question.disableNext();
        }
    }

    public selected(): boolean {
        return $('#'+this.id).is(':checked');
    }

    public isCorrect(){
        return this.correct;
    }

    public useKey(key: number){
        $(CONTINUE).hide();
        var elem = '#' + this.id;
        $(elem).prop('disabled', 'true');
        $(document).keypress((k: KeyboardEvent) => {
            if (k.which === key){
                $(elem).prop('checked', (i, val) => {return !val});
                this.onChange();
            }
        });
    }

}

class RadioOption extends ResponseOption{
    display(){
        var label = document.createElement("label");
        $(label).attr("for", this.id);
        $(label).append(this.text);

        var input = document.createElement("input");
        $(input).attr({type: "radio", id: this.id, name: this.question.id});
        $(input).change((m:MouseEvent) => {this.onChange();});

        $(OPTIONS).append(label);
        $(OPTIONS).append(input);
        $(OPTIONS).append(this.resources);
    }

}

class CheckOption extends ResponseOption{
    display(){
        var label = document.createElement("label");
        $(label).attr("for", this.id);
        $(label).append(this.text);

        var input = document.createElement("input");
        $(input).attr({type: "checkbox", id: this.id, name: this.question.id});
        $(input).change((m:MouseEvent) => {this.onChange();});

        $(OPTIONS).append(label);
        $(OPTIONS).append(input);
    }
}

class TextOption extends ResponseOption{
    private regex: RegExp;

    constructor(jsonOption, block){
        jsonOption = _.defaults(jsonOption, {text: "", correct: null});
        super(jsonOption, block);
        if (jsonOption.correct){
            this.regex = new RegExp(jsonOption.correct);
        }
    }

    display(){
        var input = document.createElement("input");
        $(input).attr({type: "text", id: this.id, name: this.question.id});
        $(OPTIONS).append(input);
        $(input).keypress((k:KeyboardEvent) => {
            // space shouldn't trigger clicking next
            k.stopPropagation();
            // this.onChange();
        });
        $(input).focus();
        this.question.enableNext(); // currently text options don't require answers
    }

    public getResponse(){
        return [this.id, $("#"+this.id).val()];
    }

    public onChange(){} // currently text options don't require answers

    public selected(){
        return this.getResponse()[1].length > 0;
    }

    public isCorrect(){
        if (this.regex){
            return Boolean(this.getResponse()[1].match(this.regex));
        } else {
            return null;
        }
    }

    useKey(key: number): void {} // nonsensical for text

}

class DropDownOption extends ResponseOption{
    private exclusive: boolean;

    constructor(jsonOption, block, exclusive){
        super(jsonOption, block);
        this.exclusive = exclusive;
    }

    display(){
        //if select element exists, append to it, otherwise create it first
        if ($(OPTIONS+" select").length === 0){
            var select = document.createElement("select");
            if (!this.exclusive){
                $(select).attr({multiple: "multiple", name: this.question.id});
            }
            $(select).change((m:MouseEvent) => {this.onChange();});
            $(OPTIONS).append(select);
        }
        var option = document.createElement("option");
        $(option).attr("id", this.id);
        $(option).append(this.text);
        $(OPTIONS+" select").append(option);
    }

    useKey(key: number){
        $(CONTINUE).hide();
        var elem = '#' + this.id;
        $(elem).prop('disabled', 'true');
        $(document).keypress((k: KeyboardEvent) => {
            if (k.which === key){
                $(elem).prop('selected', (i, val) => {return !val});
                this.onChange();
            }
        });
    }

}
