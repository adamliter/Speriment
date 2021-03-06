from speriment import *
import json, pytest, copy

def test_new():
    with make_experiment(IDGenerator()):
        o = Option('a')
        o2 = o.new()
        assert o.id_str != o2.id_str

def test_get_rows():
    answer = [['Col1', 'Col2'], ['one', 'two'], ['three', 'four']]
    rows = get_rows('speriment/test/tab_sep.csv', sep='\t')
    assert rows == answer
    rows2 = get_rows('speriment/test/comma_sep.csv')
    assert rows2 == answer

def test_get_dicts():
    answer = [{'Col1': 'one', 'Col2': 'two'}, {'Col1': 'three', 'Col2': 'four'}]
    rows = get_dicts('speriment/test/tab_sep.csv', sep='\t')
    assert rows == answer
    rows2 = get_dicts('speriment/test/comma_sep.csv')
    assert rows2 == answer

def test_compile_treatments():
    with make_experiment(IDGenerator()):
        b1 = Block(pages = [])
        b2 = Block(pages = [])
        b3 = Block(pages = [])
        outer = Block(blocks = [b1, b2, b3], treatments = [[b1, b3], [b2]])
        exp = Experiment(blocks = [outer])
        json_exp = exp.to_JSON()
        compiled_exp = json.loads(json_exp)
        assert compiled_exp['blocks'][0]['blocks'][0]['runIf']['permutation'] == 0
        assert compiled_exp['blocks'][0]['blocks'][1]['runIf']['permutation'] == 1
        assert compiled_exp['blocks'][0]['blocks'][2]['runIf']['permutation'] == 0

def test_item():
    with make_experiment(IDGenerator()):
        p1 = Page("hello")
        p2 = Page("world")
        i1 = Item([p1, p2], condition = 'item_cond', tags = {'item_tag': 'has pages'})
        i2 = Item("just text", condition = 'item_cond')
        i3 = Item(Page("single page"))
        b1 = Block(items = [i1, i2, i3])
        exp = Experiment(blocks = [b1])
        json_exp = exp.to_JSON()
        compiled_exp = json.loads(json_exp)
        jb1 = compiled_exp['blocks'][0]
        ji1 = jb1['items'][0]
        ji2 = jb1['items'][1]
        ji3 = jb1['items'][2]
        assert len(ji1['pages']) == 2
        assert len(ji2['pages']) == 1
        assert len(ji3['pages']) == 1
        assert ji1['condition'] == 'item_cond'
        assert ji1['tags']['item_tag'] == 'has pages'
        assert ji2['condition'] == 'item_cond'
        assert ji1['pages'][0]['text'] == 'hello'
        assert ji2['pages'][0]['text'] == 'just text'
        assert ji3['pages'][0]['text'] == 'single page'

def test_feedback():
    with make_experiment(IDGenerator()):
        p1 = Page(text = "hello",
                options = [Option('a', feedback = 'a is correct'), Option('b', feedback = Page('b is incorrect'))])
        p2 = Page(text = "world", feedback = 'that was page 2')
        p3 = Page(text = "third", feedback = Page('that was page 3'))
        i1 = Item([p1, p2, p3])
        i2 = Item(Page("hello", feedback = 'that was the first page of item 2'))
        b1 = Block(items = [i1, i2])
        exp = Experiment(blocks = [b1])
        json_exp = exp.to_JSON()
        compiled_exp = json.loads(json_exp)
        ji1 = compiled_exp['blocks'][0]['items'][0]
        ji2 = compiled_exp['blocks'][0]['items'][1]
        assert len(ji1['pages']) == 7
        assert len(ji2['pages']) == 2
        assert ji1['pages'][1]['text'] == "a is correct"
        assert ji1['pages'][1]['runIf']['optionID'] == ji1['pages'][0]['options'][0]['id']
        assert ji1['pages'][1]['runIf']['pageID'] == ji1['pages'][0]['id']
        assert ji1['pages'][2]['text'] == "b is incorrect"
        assert ji1['pages'][2]['runIf']['optionID'] == ji1['pages'][0]['options'][1]['id']
        assert ji1['pages'][2]['runIf']['pageID'] == ji1['pages'][0]['id']
        assert ji1['pages'][3]['text'] == "world"
        assert ji1['pages'][4]['text'] == "that was page 2"
        assert 'runIf' not in ji1['pages'][4]
        assert ji1['pages'][5]['text'] == "third"
        assert ji1['pages'][6]['text'] == "that was page 3"
        assert 'runIf' not in ji1['pages'][6]
        assert ji2['pages'][0]['text'] == "hello"
        assert ji2['pages'][1]['text'] == "that was the first page of item 2"
        assert 'runIf' not in ji2['pages'][1]

def test_exactly_one():
    with make_experiment(IDGenerator()):
        with pytest.raises(ValueError):
            b = Block(pages = [], groups = [])
            b._validate()
        b2 = Block(pages = [])
        b2._validate()
        with pytest.raises(ValueError):
            b3 = Block()
            b3._validate()

def test_at_most_one():
    s = SampleFrom(bank = 'a', variable = 0, not_variable = 1)
    s2 = SampleFrom(bank = 'a', variable = 0)
    s3 = SampleFrom(bank = 'a')
    with pytest.raises(ValueError):
        s._validate()
    s2._validate()
    s3._validate()

def test_auto_option():
    with make_experiment(IDGenerator()):
        p = Page('What is your name?', freetext = True)
        e = Experiment(blocks = [Block(items = [Item([p])])])
        ejson = json.loads(e.to_JSON())
        assert len(ejson['blocks'][0]['items'][0]['pages'][0]['options']) == 1

def test_compile_resources():
    with make_experiment(IDGenerator()):
        p1 = Page('hi',
                resources = [
                    'cats.jpg',
                    Resource('dogs.ogg', media_type = 'video', autoplay = True, controls = False, required = True),
                    'elephants.mp4',
                    SampleFrom('animals')])
        exp = Experiment(
                blocks = [
                    Block(
                        items = [Item([p1])],
                        banks = {'animals': ['giraffe.jpg']})])
        json_exp = exp.to_JSON()
        compiled_exp = json.loads(json_exp)
        resources = compiled_exp['blocks'][0]['items'][0]['pages'][0]['resources']
        assert resources[0] == {u'source': u'cats.jpg', u'mediaType': None, u'controls': True, u'autoplay': False, u'required': False}
        assert resources[1] == {u'source': u'dogs.ogg', u'mediaType': u'video', u'controls': False, u'autoplay': True, u'required': True}
        assert resources[2] == {u'source': u'elephants.mp4', u'mediaType': None, u'controls': True, u'autoplay': False, u'required': False}
        assert resources[3] == {u'sampleFrom': u'animals', u'variable': 0}

def test_block():
    pass

def test_check_list():
    with make_experiment(IDGenerator()):
        p1 = Page('hi', options = Option('hi'))
        with pytest.raises(ValueError):
            p1._validate()
        p2 = Page('hi', resources = Resource('hi'))
        with pytest.raises(ValueError):
            p2._validate()

def test_option():
    pass

def test_sample_from():
    # SampleFrom can be: page text, page feedback text, option text, page resource source, option resource source, page tag, option tag, page correct, item condition
    pass

